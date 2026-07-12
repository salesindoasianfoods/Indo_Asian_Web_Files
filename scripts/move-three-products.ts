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
  const snacksCategory = await client.fetch('*[_type == "category" && name == "SNACKS & NOODLES"][0]');
  const oilsCategory = await client.fetch('*[_type == "category" && name == "OILS"][0]');
  const otherCategory = await client.fetch('*[_type == "category" && name == "OTHER ITEMS"][0]');
  
  if (!snacksCategory || !oilsCategory || !otherCategory) {
    throw new Error("One or more target categories not found!");
  }
  
  console.log("Finding products...");
  const gingallyCandy = await client.fetch('*[_type == "product" && code == "GING-M"][0]');
  const ginglyOil = await client.fetch('*[_type == "product" && code == "GINGLYOID"][0]');
  const jackfruit = await client.fetch('*[_type == "product" && code == "JACK-M"][0]');
  
  const transaction = client.transaction();

  if (gingallyCandy) {
    console.log(`Patching ${gingallyCandy.name} to SNACKS & NOODLES and removing image...`);
    transaction.patch(gingallyCandy._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: snacksCategory._id } })
       .unset(['image'])
    );
  }

  if (ginglyOil) {
    console.log(`Patching ${ginglyOil.name} to OILS...`);
    transaction.patch(ginglyOil._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: oilsCategory._id } })
    );
  }

  if (jackfruit) {
    console.log(`Patching ${jackfruit.name} to OTHER ITEMS...`);
    transaction.patch(jackfruit._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: otherCategory._id } })
    );
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully processed the updates!");
}

main().catch(console.error);

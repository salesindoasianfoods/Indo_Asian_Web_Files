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
  
  if (!snacksCategory) throw new Error("SNACKS & NOODLES category not found");
  if (!oilsCategory) throw new Error("OILS category not found");
  
  console.log("Finding target products...");
  const murukku = await client.fetch('*[_type == "product" && code == "GARM-M"][0]');
  const ginglyOil = await client.fetch('*[_type == "product" && code == "GINB-M"][0]');
  
  if (!murukku) throw new Error("Garlic Murukku not found");
  if (!ginglyOil) throw new Error("Gingly Oil not found");
  
  console.log("Patching Garlic Murukku to SNACKS & NOODLES...");
  await client.patch(murukku._id).set({
    category: { _type: "reference", _ref: snacksCategory._id }
  }).commit();
  
  console.log("Patching Gingly Oil to OILS...");
  await client.patch(ginglyOil._id).set({
    category: { _type: "reference", _ref: oilsCategory._id }
  }).commit();
  
  console.log("Successfully moved both products!");
}

main().catch(console.error);

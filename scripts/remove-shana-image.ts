import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding product...");
  
  const product = await client.fetch('*[_type == "product" && name match "SHANA AAILA OKRA WHOLE*"][0]');
  
  if (!product) {
    console.error("SHANA AAILA OKRA WHOLE not found!");
    return;
  }

  console.log(`Removing image from ${product.name}...`);
  await client.patch(product._id).unset(['image']).commit();
  console.log("Successfully removed image!");
}

main().catch(console.error);

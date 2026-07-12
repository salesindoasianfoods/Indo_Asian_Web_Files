import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding products...");
  
  const fennel = await client.fetch('*[_type == "product" && name match "PR FENNEL WHOLE*"][0]');
  const tapioca = await client.fetch('*[_type == "product" && name match "PR TAPIOCA MOGO CHIPS*"][0]');
  const bananaChips = await client.fetch('*[_type == "product" && name match "MC SWEET (RIPE) BANANA CHIPS*"][0]');
  
  const transaction = client.transaction();

  if (fennel) {
    console.log(`Removing image from ${fennel.name}...`);
    transaction.patch(fennel._id, (p: any) => p.unset(['image']));
  }

  if (tapioca) {
    console.log(`Removing image from ${tapioca.name}...`);
    transaction.patch(tapioca._id, (p: any) => p.unset(['image']));
  }

  if (bananaChips) {
    console.log(`Removing image from ${bananaChips.name}...`);
    transaction.patch(bananaChips._id, (p: any) => p.unset(['image']));
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully removed images!");
}

main().catch(console.error);

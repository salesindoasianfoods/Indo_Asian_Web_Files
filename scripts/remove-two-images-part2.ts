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
  
  const shanaOkra = await client.fetch('*[_type == "product" && name match "SHANA AAILA OKRA WHOLE*"][0]');
  const sarasPotato = await client.fetch('*[_type == "product" && name match "SARAS BOILED CHINESE POTATO*"][0]');
  
  const transaction = client.transaction();

  if (shanaOkra) {
    console.log(`Removing image from ${shanaOkra.name}...`);
    transaction.patch(shanaOkra._id, (p: any) => p.unset(['image']));
  } else {
    console.warn("SHANA AAILA OKRA WHOLE not found!");
  }

  if (sarasPotato) {
    console.log(`Removing image from ${sarasPotato.name}...`);
    transaction.patch(sarasPotato._id, (p: any) => p.unset(['image']));
  } else {
    console.warn("SARAS BOILED CHINESE POTATO not found!");
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully removed images!");
}

main().catch(console.error);

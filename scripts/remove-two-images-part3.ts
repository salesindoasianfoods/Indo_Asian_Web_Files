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
  
  const tata = await client.fetch('*[_type == "product" && code == "TATA"][0]');
  const mcVermicelli = await client.fetch('*[_type == "product" && code == "MCVERMUN"][0]');
  
  const transaction = client.transaction();

  if (tata) {
    console.log(`Removing image from ${tata.name}...`);
    transaction.patch(tata._id, (p: any) => p.unset(['image']));
  } else {
    console.warn("TATASALT1 not found!");
  }

  if (mcVermicelli) {
    console.log(`Removing image from ${mcVermicelli.name}...`);
    transaction.patch(mcVermicelli._id, (p: any) => p.unset(['image']));
  } else {
    console.warn("MC VERMICELLI not found!");
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully removed images!");
}

main().catch(console.error);

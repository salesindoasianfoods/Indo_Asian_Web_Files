import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  const products = await client.fetch('*[_type == "product" && (name match "candy*" || name match "finally*")]{name, code, _id}');
  console.log(`Found ${products.length} products:`);
  products.forEach((p: any) => console.log(`- ${p.name} (${p.code})`));
}

main().catch(console.error);

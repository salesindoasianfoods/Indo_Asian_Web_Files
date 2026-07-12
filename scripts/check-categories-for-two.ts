import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Fetching the two products...");
  const products = await client.fetch('*[_type == "product" && (code == "GARM-M" || code == "GINB-M")]{name, code, "currentCategory": category->name}');
  console.log(JSON.stringify(products, null, 2));

  console.log("\nFetching all categories to find the best match...");
  const categories = await client.fetch('*[_type == "category"]{name} | order(name asc)');
  console.log(categories.map((c: any) => c.name).join(", "));
}

main().catch(console.error);

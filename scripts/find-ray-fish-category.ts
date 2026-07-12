import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

async function main() {
  try {
    // 1. Get the current product category
    const products = await client.fetch(`*[_type == "product" && code == "RAYF-M"]{name, code, category->{name, _id}}`);
    console.log("Current Product:", products[0]);

    // 2. Find all categories to see which one it should be in
    const categories = await client.fetch(`*[_type == "category"]{name, _id}`);
    console.log("Available Categories:");
    categories.filter((c: any) => c.name.toLowerCase().includes("fish") || c.name.toLowerCase().includes("sea") || c.name.toLowerCase().includes("delight")).forEach((c: any) => {
        console.log(`- ${c.name} (${c._id})`);
    });

  } catch (error) {
    console.error("Error:", error);
  }
}

main();

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
    const codes = ["RESP-M"];
    
    for (const code of codes) {
      const products = await client.fetch(`*[_type == "product" && code == "${code}"]`);
      if (products.length === 0) {
        console.log(`Product with code ${code} not found`);
        continue;
      }
      
      const product = products[0];
      console.log(`Found product: ${product.name} (Code: ${product.code}), removing image...`);
      
      await client
        .patch(product._id)
        .unset(["image"])
        .commit();
        
      console.log(`Successfully removed image from ${code}!`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

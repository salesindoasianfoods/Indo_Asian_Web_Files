import { createClient } from "@sanity/client";
import { createReadStream } from "fs";
import path from "path";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

async function main() {
  try {
    // 1. Find the product
    const products = await client.fetch(`*[_type == "product" && code == "VSDATCARCAK"]`);
    if (products.length === 0) {
      console.log("Could not find product with code VSDATCARCAK");
      return;
    }
    const product = products[0];
    console.log(`Found product: ${product.name} (Code: ${product.code}) (_id: ${product._id})`);

    // 2. Upload image
    const imagePath = path.resolve(process.cwd(), "extracted_images", "DATES AND CARROT 700G 10pkt x 700g.webp");
    console.log(`Uploading image: ${imagePath}`);
    
    const asset = await client.assets.upload("image", createReadStream(imagePath), {
      filename: "DATES AND CARROT 700G 10pkt x 700g.webp"
    });
    console.log(`Uploaded asset with _id: ${asset._id}`);

    // 3. Patch product
    await client
      .patch(product._id)
      .set({
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id
          }
        }
      })
      .commit();
      
    console.log("Successfully updated Dates and Carrot 700G with new image!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

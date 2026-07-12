import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

const uploadList = [
    { file: "BOMBAY MIXTURE 15btl x 350g.jpeg", sanityName: "VS BOMBAY MIXTURE BOTTLE 350 X 15" },
    { file: "ELAYADA JAGGERY 350g 12pkt X 350g.jpeg", sanityName: "VIS ELAYADA JAGGERY 350G X12" },
    { file: "PAKKAVADA 15btl x 200g.jpeg", sanityName: "VS PAKKAVADA BTL 200 X 15" },
    { file: "RASAM POWDER 160g 12pkt X 160g.jpeg", sanityName: "VS RASAM POWDER 160G X12" },
    { file: "SAMBAR POWDER 160g 12pkt X 160g.jpeg", sanityName: "VS SAMBAR POWDER 160G X12" },
    { file: "VEGETABLE MASALA 160g 12pkt X 160g.jpeg", sanityName: "VS VEGETABLE MASALA 160G X12" },
    { file: "YAM RATALU 400g 12pkt X 400g.jpeg", sanityName: "VS YAM RATALU 400GM X 12" }
];

async function main() {
  const imageDir = path.join(process.cwd(), "products-ref", "Indo asian", "viswas-images-new");

  for (const item of uploadList) {
    const filePath = path.join(imageDir, item.file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }
    
    console.log(`Looking for product: ${item.sanityName}`);
    const products = await client.fetch(`*[_type == "product" && name == $name]`, { name: item.sanityName });
    
    if (products.length === 0) {
        console.log(`Product not found in sanity: ${item.sanityName}`);
        continue;
    }
    
    const product = products[0];
    
    console.log(`Uploading image for ${product.name}...`);
    const imageAsset = await client.assets.upload('image', fs.createReadStream(filePath), {
      filename: item.file
    });
    
    console.log(`Patching product ${product._id}...`);
    await client.patch(product._id).set({
      image: {
        _type: 'image',
        asset: {
          _type: "reference",
          _ref: imageAsset._id
        }
      }
    }).commit();
    
    console.log(`Successfully updated ${product.name}!\n`);
  }
  console.log("All uploads complete!");
}

main().catch(console.error);

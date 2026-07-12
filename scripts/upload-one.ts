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

async function main() {
    const item = { imageFile: "CHEMBA PUTTU AND KADALA", name: "VIS CHEMBA PUTTU N KADALA  454 X 10" };
    const imagePath = "D:\\Fenar\\Web_Works\\Indo_Asian\\Indo_Asian_DC\\products-ref\\Indo asian\\viswas-images-new\\CHEMBA PUTTU AND KADALA  454g 12pkt X 454g.jpeg";
    
    const existingProduct = await client.fetch(`*[_type == "product" && name == $name][0]`, { name: item.name });
    let productId;
    if (existingProduct) {
        productId = existingProduct._id;
    } else {
        const created = await client.create({
            _type: 'product',
            name: item.name,
            price: 21.90,
            category: { _type: 'reference', _ref: 'JgNZwVoOE3fVRWVQtDY3tC' }
        });
        productId = created._id;
    }
    
    console.log(`Uploading image from ${imagePath}...`);
    const imageAsset = await client.assets.upload('image', fs.createReadStream(imagePath), {
        filename: path.basename(imagePath)
    });
    
    console.log(`Linking image to product...`);
    await client.patch(productId)
        .set({
            image: {
                _type: 'image',
                asset: {
                    _type: "reference",
                    _ref: imageAsset._id
                }
            }
        })
        .commit();
        
    console.log(`✅ Fully processed ${item.name}!`);
}

main().catch(console.error);

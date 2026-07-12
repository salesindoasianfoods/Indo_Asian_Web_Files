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

const uploadMap = {
  "BABY RICE MURUKU  25pkt x 150g .jpg": "VS BABY RICE MURUKKU SPICY 150G X 25",
  "CHEMBA PUTTU PODI  1kg 12pkt X 1kg.jpg": "DH CHEMBA PUTTU PODI  1KG X12",
  "LIME HOT & SWEET  400g 12Btl X 400g.jpg": "VS HOT & SWEET LIME PICKLE 400G X12",
  "RICE POWDER  1kg 12pkt X 1kg.jpg": "BR RICE POWDER (ROASTED) 1KG X12",
  "SPICY BABY RICE MURUKU  25pkt x 150g .jpg": "VS BABY RICE MURUKKU SPICY 150G X 25"
};

async function main() {
    const allProducts = await client.fetch(`*[_type == "product"]{_id, name, "hasImage": defined(image)}`);
    const imagesDir = path.join(process.cwd(), "products-ref", "Indo asian 2", "Indo asian"); // Assuming they're here or Viswas directory
    // Actually the user mentioned they are in "Indo asian 2" or "viswas-images-new". 
    // We will search both to be sure.
    function findFileRecursively(dir: string, filename: string): string | null {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const p = path.join(dir, f);
            const stat = fs.statSync(p);
            if (stat.isDirectory()) {
                const found = findFileRecursively(p, filename);
                if (found) return found;
            } else if (f === filename || f.replace(/\s+\./, '.') === filename.replace(/\s+\./, '.')) {
                return p;
            }
        }
        return null;
    }
    
    let uploadedCount = 0;
    
    for (const [filename, sanityName] of Object.entries(uploadMap)) {
        const product = allProducts.find((p: any) => p.name === sanityName);
        if (!product) {
            console.log(`❌ Sanity product not found for: ${sanityName}`);
            continue;
        }
        
        let imagePath = findFileRecursively(path.join(process.cwd(), "products-ref"), filename);
        
        if (!imagePath) {
            console.log(`❌ File not found locally: ${filename}`);
            continue;
        }
        
        console.log(`Uploading image for ${sanityName}...`);
        
        const imageAsset = await client.assets.upload('image', fs.createReadStream(imagePath), {
            filename: filename
        });
        
        console.log(`Patching product ${product._id}...`);
        await client.patch(product._id)
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
            
        console.log(`✅ Successfully updated ${sanityName}!\\n`);
        uploadedCount++;
    }
    
    console.log(`🎉 All done! Successfully uploaded ${uploadedCount} remaining mapped images!`);
}

main();

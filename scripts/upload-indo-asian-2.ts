import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";
import { basename } from "path";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

function parseWeight(str: string): number | null {
    let m = str.match(/(\d+)\s*(g|gm|kg|ml|l)\b/i);
    if (m) {
        let val = parseFloat(m[1]);
        let unit = m[2].toLowerCase();
        if (unit === 'kg' || unit === 'l') val *= 1000;
        return val;
    }
    m = str.match(/(\d+)\s*x\s*\d+/i);
    if (m) {
        return parseFloat(m[1]);
    }
    return null;
}

function extractCoreName(str: string): string {
    let clean = str.toLowerCase();
    clean = clean.replace(/^(viswas|vis|vs)\s+/i, '');
    clean = clean.replace(/\d+\s*(pkt|btl|pieces)\s*[xX]\s*\d+\s*(g|gm|kg)?/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\b/gi, '');
    clean = clean.replace(/[()]/g, '');
    clean = clean.replace(/\b\d+\b/g, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
}

async function uploadImage(filePath: string, productId: string, productName: string) {
    console.log(`\nUploading image for ${productName}...`);
    try {
        const fileStream = fs.createReadStream(filePath);
        const asset = await client.assets.upload('image', fileStream, {
            filename: basename(filePath)
        });
        
        console.log(`Patching product ${productId}...`);
        await client.patch(productId)
            .set({
                image: {
                    _type: 'image',
                    asset: {
                        _type: "reference",
                        _ref: asset._id
                    }
                }
            })
            .commit();
            
        console.log(`✅ Successfully updated ${productName}!`);
    } catch (err) {
        console.error(`❌ Error uploading image for ${productName}:`, err);
    }
}

async function main() {
  const imageDir = path.join(process.cwd(), "products-ref", "Indo asian 2", "Indo asian");
  
  if (!fs.existsSync(imageDir)) {
      console.log("Directory does not exist:", imageDir);
      return;
  }
  
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".webp") || f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg"));
  
  let allProducts = await client.fetch(`*[_type == "product"]{_id, name, "hasImage": defined(image)}`);
  
  const products = allProducts.filter((p: any) => 
    p.name.toUpperCase().startsWith("VIS ") || 
    p.name.toUpperCase().startsWith("VS ") ||
    p.name.toUpperCase().startsWith("VISWAS ")
  );
  
  let uploadCount = 0;
  
  for (const file of files) {
    const filenameWithoutExt = path.parse(file).name;
    const coreFileName = extractCoreName(filenameWithoutExt);
    const fileWeight = parseWeight(filenameWithoutExt);
    
    let bestMatch = null;
    
    for (const p of products) {
        const coreProdName = extractCoreName(p.name);
        if (coreFileName.length < 3 || coreProdName.length < 3) continue;
        
        if (coreProdName === coreFileName || coreProdName.includes(coreFileName) || coreFileName.includes(coreProdName)) {
            const prodWeight = parseWeight(p.name);
            if (fileWeight !== null && prodWeight !== null) {
                if (fileWeight === prodWeight) {
                    bestMatch = p;
                    break;
                }
            } else if (fileWeight === prodWeight) {
                bestMatch = p;
                break;
            }
        }
    }
    
    if (bestMatch && !bestMatch.hasImage) {
        // Upload it!
        const fullPath = path.join(imageDir, file);
        await uploadImage(fullPath, bestMatch._id, bestMatch.name);
        uploadCount++;
    }
  }
  
  console.log(`\n🎉 All done! Successfully uploaded ${uploadCount} images!`);
}
main();

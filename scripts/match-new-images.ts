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

function parseWeight(str: string): number | null {
    // 1. Try to find number with explicit unit (e.g. 150g, 150 g, 1kg)
    let m = str.match(/(\d+)\s*(g|gm|kg|ml|l)\b/i);
    if (m) {
        let val = parseFloat(m[1]);
        let unit = m[2].toLowerCase();
        if (unit === 'kg' || unit === 'l') val *= 1000;
        return val;
    }
    
    // 2. Try to find number before an 'X' (e.g. 300X15 or 300 X 15)
    // Often in Sanity they omit the 'G' and just write 300 X 15
    m = str.match(/(\d+)\s*x\s*\d+/i);
    if (m) {
        return parseFloat(m[1]);
    }
    
    return null;
}

// Extract just the core product name words (removing weights, units, pack sizes, brand prefixes)
function extractCoreName(str: string): string {
    let clean = str.toLowerCase();
    
    // Remove brand prefixes
    clean = clean.replace(/^(viswas|vis|vs)\s+/i, '');
    
    // Remove anything that looks like a box size or weight (e.g. 15btl x 250g, 250g x15, 300x15)
    clean = clean.replace(/\d+\s*(pkt|btl|pieces)\s*[xX]\s*\d+\s*(g|gm|kg)?/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\b/gi, '');
    
    // Remove stray numbers and parenthesis
    clean = clean.replace(/[()]/g, '');
    clean = clean.replace(/\b\d+\b/g, '');
    
    // Clean up extra spaces
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
}

async function main() {
  const imageDir = path.join(process.cwd(), "products-ref", "Indo asian 2", "Indo asian");
  
  if (!fs.existsSync(imageDir)) {
      console.log("Directory does not exist:", imageDir);
      return;
  }
  
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".webp") || f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg"));
  
  let allProducts = await client.fetch(`*[_type == "product"]{_id, name, "hasImage": defined(image)}`);
  
  // Strictly filter to Viswas only
  const products = allProducts.filter((p: any) => 
    p.name.toUpperCase().startsWith("VIS ") || 
    p.name.toUpperCase().startsWith("VS ") ||
    p.name.toUpperCase().startsWith("VISWAS ")
  );
  
  const alreadyHasImage: {file: string, productName: string}[] = [];
  const needsImage: {file: string, productName: string, productId: string}[] = [];
  const unmatched: {file: string}[] = [];
  const weightMismatch: {file: string, productName: string, fileWeight: number | null, prodWeight: number | null}[] = [];
  
  for (const file of files) {
    const filenameWithoutExt = path.parse(file).name;
    const coreFileName = extractCoreName(filenameWithoutExt);
    const fileWeight = parseWeight(filenameWithoutExt);
    
    let bestMatch = null;
    
    // 1. Find all potential products where the core name is deeply similar
    for (const p of products) {
        const coreProdName = extractCoreName(p.name);
        
        // Ensure both strings have actual content to avoid empty matches
        if (coreFileName.length < 3 || coreProdName.length < 3) continue;
        
        // Strictly require that the core filename is entirely within the sanity core name, 
        // OR the sanity core name is entirely within the core filename.
        // E.g. "tapioca stick spicy" == "tapioca stick spicy bottle"
        if (coreProdName === coreFileName || coreProdName.includes(coreFileName) || coreFileName.includes(coreProdName)) {
            
            // If they match in name, check weight!
            const prodWeight = parseWeight(p.name);
            
            // If we can extract a weight from BOTH, they MUST match.
            if (fileWeight !== null && prodWeight !== null) {
                if (fileWeight === prodWeight) {
                    bestMatch = p;
                    break; // Perfect match found!
                }
            } else if (fileWeight === prodWeight) {
                // Both are null, so no weight conflict. (Rare, but allowed)
                bestMatch = p;
                break;
            }
        }
    }
    
    if (bestMatch) {
      if (bestMatch.hasImage) {
        alreadyHasImage.push({ file, productName: bestMatch.name });
      } else {
        needsImage.push({ file, productName: bestMatch.name, productId: bestMatch._id });
      }
    } else {
        // Let's see if there was a weight mismatch that prevented it from matching
        let mismatchFound = false;
        for (const p of products) {
            const coreProdName = extractCoreName(p.name);
            if (coreProdName.length > 2 && (coreProdName.includes(coreFileName) || coreFileName.includes(coreProdName))) {
                const prodWeight = parseWeight(p.name);
                if (fileWeight !== null && prodWeight !== null && fileWeight !== prodWeight) {
                    weightMismatch.push({ file, productName: p.name, fileWeight, prodWeight });
                    mismatchFound = true;
                    break;
                }
            }
        }
        
        if (!mismatchFound) {
            unmatched.push({ file });
        }
    }
  }
  
  console.log("=== STRICTLY VERIFIED (NEEDS IMAGE) ===");
  needsImage.forEach(x => console.log(`- File: ${x.file}  --->  Product: ${x.productName}`));
  
  console.log("\n=== STRICTLY VERIFIED (ALREADY HAS IMAGE) ===");
  alreadyHasImage.forEach(x => console.log(`- File: ${x.file}  --->  Product: ${x.productName}`));
  
  console.log("\n=== DROPPED: WEIGHT MISMATCH (Name matched, but Grams didn't) ===");
  weightMismatch.forEach(x => console.log(`- File: ${x.file} (Weight: ${x.fileWeight})  --->  Product: ${x.productName} (Weight: ${x.prodWeight})`));
  
}
main();

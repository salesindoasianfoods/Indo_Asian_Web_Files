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

const unmatchedFiles = [
"AVALOSE UNDS 25pkt x 300g.jpg",
"BABY RICE MURUKU 25pkt x 150g .jpg",
"BITTERGOURD CUT 400g 12pkt X 400g.jpg",
"BITTERGOURD PICKLE 400g 12Btl X 400g.jpg",
"BROKEN SUCHI WHEAT 1kg.jpg",
"CARDAMON 100g.jpg",
"CATERING WHEAT POROTTA 908g (10 pieces) 16pkt x 908g.jpg",
"CHEMBA PUTTU PODI 1kg 12pkt X 1kg.jpg",
"CHINESE POTATO 400g 12pkt X 400g .jpg",
"CLOVES 100g.jpg",
"COCONUT CHUTNEY 400g 12Btl X 400g.jpg",
"CORIANDER POWDER 250g 24pkt x 250g.jpg",
"CORIANDER POWDER 400g 24pkt x 400g.jpg",
"CORIANDER WHOLE 100g.jpg",
"DATES AND CARROT 700G 10pkt x 700g.jpg",
"DATES AND CASHEW 350G 12pkt x 350g .jpg",
"DATES AND CASHEW 700G 10pkt x 700g.jpg",
"FAMILY CHAPPATHI 908g 14pkt x 908g.jpg",
"FENNEL 100g.jpg",
"GINGELLY CANDY 30pkt x 200g.jpg",
"GREEN CHILLI 400g 12pkt X 400g.jpg",
"IDIYAPPAM BROWN 1kg 12pkt X 1kg.jpg",
"IDLY DOSA CHUTLEY 400g 12Btl X 400g.jpg",
"INSTANT PALAPPAM 1kg 12pkt X 1kg.jpg",
"INSTANT SEMIYA MIX 250g 24pkt x 250g .jpg",
"INSTANT UPMA MIX 1kg 12pkt X 1kg.jpg",
"JACKFRUIT WHOLE 400g 12pkt X 400g.jpg",
"KANTHARI IN BRINE 400g 12Btl X 400g.jpg",
"KANTHARI MANGO 400g 12Btl X 400g.jpg",
"KASHMIRI CHILLI WHOLE 100g.jpg",
"LIME HOT & SWEET 400g 12Btl X 400g.jpg",
"MIXED VEGETABLE 400g 12Btl X 400g.jpg",
"MUSTARD SEEDS 100g.jpg",
"RESTAURANT POROTTA 2kg 8pkt x 2kg.jpg",
"RICE POWDER 1kg 12pkt X 1kg.jpg",
"RICH PLUM DELIGHT 350 12pkt x 350g .jpg",
"RICH PLUM DELIGHT 700G 10pkt x 700g.jpg",
"ROASTED RAVA(SEMOLINA) 1kg 12pkt X 1kg.jpg",
"SHARKKARAVARATTY 30pkt x 150g .jpg",
"SOYA CHUNK BIG 20pkt x 200g.jpg",
"SPICY BABANA CHIPS 30pkt x 150g .jpg",
"SPICY BABY RICE MURUKU 25pkt x 150g .jpg",
"STAR ANISE 100g.jpg",
"TAPIOCA CHIPS ROUND PLAN 25pkt x 150g.jpg",
"TAPIOCA STICK PLAIN 25pkt x 150g.jpg",
"UNROASTED RICE FLOUR 1kg 12pkt X 1kg.jpg",
"WHEAT POROTTA 454g 15pkt x 454g.jpg"
];

function extractCoreName(str: string): string {
    let clean = str.toLowerCase();
    clean = clean.replace(/^(viswas|vis|vs|dd|mc|pr|grb|town bus|tb|haldi|hd|shana|saras|sar|mayil|ml|magic t|mt|pluvera|pulv)\s+/i, '');
    clean = clean.replace(/\d+\s*(pkt|btl|pieces)\s*[xX]\s*\d+\s*(g|gm|kg)?/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\b/gi, '');
    clean = clean.replace(/[()&',]/g, '');
    clean = clean.replace(/\b\d+\b/g, '');
    clean = clean.replace(/\./g, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
}

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

async function main() {
  let allProducts = await client.fetch(`*[_type == "product"]{_id, name, price, "hasImage": defined(image)}`);
  
  const mapped = [];
  const unmapped = [];
  
  for (const file of unmatchedFiles) {
    // SHARKKARAVARATTY manual override because of H and K extra letters
    if (file.includes("SHARKKARAVARATTY")) {
        const p = allProducts.find((p: any) => p.name === "VS SARKARAVARATTY 150 X25");
        if (p) {
            mapped.push(`- **Image**: \`${file}\`\\n  ➔ **Product**: \`${p.name}\`\\n  ➔ **Price**: £${p.price || 'N/A'}\\n`);
            continue;
        }
    }

    const filenameWithoutExt = path.parse(file).name;
    const coreFileName = extractCoreName(filenameWithoutExt);
    const fileWeight = parseWeight(filenameWithoutExt);
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const p of allProducts) {
        const coreProdName = extractCoreName(p.name);
        if (coreProdName.length < 3) continue;
        
        const fileWords = coreFileName.split(' ').filter(w => w.length > 2);
        const prodWords = coreProdName.split(' ').filter(w => w.length > 2);
        
        let matchCount = 0;
        for (const w of fileWords) {
            if (prodWords.includes(w) || coreProdName.includes(w)) matchCount++;
        }
        for (const w of prodWords) {
             if (fileWords.includes(w) || coreFileName.includes(w)) matchCount++;
        }
        
        if (matchCount >= fileWords.length - 1 && matchCount > highestScore) {
            const prodWeight = parseWeight(p.name);
            if (fileWeight !== null && prodWeight !== null && fileWeight !== prodWeight) continue; 
            
            highestScore = matchCount;
            bestMatch = p;
        }
    }
    
    if (bestMatch) {
        mapped.push(`- **Image**: \`${file}\`\\n  ➔ **Product**: \`${bestMatch.name}\`\\n  ➔ **Price**: £${bestMatch.price || 'N/A'}\\n`);
    } else {
        unmapped.push(`- \`${file}\``);
    }
  }
  
  const mdContent = `
# Pre-Upload Mapping Report

Here is the exact list of how the client's image files will be mapped into your Sanity database, including the price of the matched product.

## 🟢 Ready to Map & Upload
${mapped.join('\\n')}

## 🔴 Unmapped (Not found in Sanity at all)
${unmapped.join('\\n')}
  `;
  
  fs.writeFileSync(path.join(process.cwd(), "report.md"), mdContent);
  console.log("Wrote mapping to implementation_plan.md");
}

main();

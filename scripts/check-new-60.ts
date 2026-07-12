import * as fs from "fs";
import * as path from "path";
import PDFParser from "pdf2json";

const unmatchedFiles = [
"ADA PRADHAMAN 500g",
"ANGAMALY MANGO CURRY 350g",
"AVIYAL 400g",
"BANANA ROAST 350g",
"BILIMBI 400g",
"Black Halwa",
"BOLI 350g",
"BONDA 350g",
"BREADFRUIT 400g",
"CHAKKA VARATTI 350g",
"CHAKKAKURU MANGA CURRY 350g",
"CHEERA THORAN 350g",
"CHEMBA PUTTU AND KADALA 454g",
"COCONUT BUN 350g",
"ELAYADA SUGAR 350g",
"GREEN CHILLI 400g",
"GURUVAYOOR PAPPADAM 200g",
"IDICHAKKA THORAN 400g",
"IDIYAPPAM BROWN 454g",
"IDIYAPPAM WHITE 400g",
"IDLI FAMILY 908g",
"IDLY CHUTNEY SAMBAR 400g",
"JACKFRUIT SLICED 400g",
"JALAPENO CHAKRI",
"JILEBI 350g",
"KERALA MIRTURE",
"KOOTTUCURRY 350g",
"KOZHUKKATTA 350g",
"KUMBILAPPAM FAMILY 908g",
"KUZHALAPAM SWEET",
"MADURA CURRY 350g",
"MASALA DOSA 400g",
"OKRA WHOLE 400g",
"PALAPPAM 350g",
"PALAPPAM AND STEW 450g",
"PATHIRI 400g",
"PICKLE POWDER 160g",
"POORI MASALA 400g",
"PUNJABI SAMOSA 350g",
"RCE MURUKKU SPICY",
"Red Halwa",
"RIPE BANANA BOTTLE",
"Sadya Feast for 5",
"SAMBAR CURRY 400g",
"SNAKE GOURD 400g",
"SPICY BANANA BOTTLE",
"STEAMED BANANA 400g",
"SUGHIYAN 350g",
"TAPIOCA ROUND PLAIN",
"TAPIOCA ROUND SPICY",
"TAPIOCA WITH CHUTNEY 350g",
"VEG CUTLET FAMILY 908g",
"VEGETABLE BIRIYANI 400g",
"Vegetable cutlet 350g",
"VEGETABLE PUFFS 350g",
"VEGETABLE PULAO 400g",
"VEGETABLE SAMOSA 350g",
"Vegetable Stew 350g",
"VENDAKKA MAPPAS 350g",
"WHEAT PUTTU AND KADALA 454g",
"WHITE MIXTURE"
];

function extractCoreName(str: string): string {
    let clean = str.toLowerCase();
    clean = clean.replace(/^(viswas|vis|vs|dd|mc|pr|grb|town bus|tb|haldi|hd|shana|saras|sar|mayil|ml|magic t|mt|pluvera|pulv)\s+/i, '');
    clean = clean.replace(/\d+\s*(pkt|btl|pieces)\s*[xX]\s*\d+\s*(g|gm|kg)?/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*[xX]\s*\d+/gi, '');
    clean = clean.replace(/\d+\s*(g|gm|kg|ml|l)\b/gi, '');
    clean = clean.replace(/[()&',-]/g, ' ');
    clean = clean.replace(/\b\d+\b/g, '');
    clean = clean.replace(/\./g, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
}

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", (errData: any) => console.error(errData) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    let fullText = "";
    for (let page of pdfData.Pages) {
        for (let t of page.Texts) {
            try {
                fullText += decodeURIComponent(t.R[0].T) + " ";
            } catch (e) {
                fullText += t.R[0].T + " ";
            }
        }
    }
    
    // Attempt to extract all products into a structured array
    const productRegex = /([A-Z0-9\.\-]+)\s+((?:VS|VIS|DD|MC|PR|MAYIL|EST|KT|BR)\s+[^]+?)\s+(\d+\.\d{2})/gi;
    
    let match;
    const allProducts = [];
    while ((match = productRegex.exec(fullText)) !== null) {
        allProducts.push({
            code: match[1],
            name: match[2].trim(),
            price: match[3]
        });
    }
    
    // But since the regex might fail on a lot of edge cases, we'll use a secondary approach: splitting the whole text into chunks and looking for prices.
    
    // We will just fuzzy match against the WHOLE text, and try to find the price nearby.
    const found = [];
    const notFound = [];
    
    for (const file of unmatchedFiles) {
        let bestMatch = null;
        let highestScore = 0;
        
        const coreFile = extractCoreName(file);
        const fileWords = coreFile.split(' ').filter(w => w.length > 2);
        
        if (fileWords.length === 0) {
             notFound.push(file);
             continue;
        }

        // We will scan through the text and try to match lines/sections
        const chunks = fullText.split(/(?=\b(?:VS|VIS|DD|MC|PR|MAYIL|EST|KT|BR)\b)/);
        
        for (const chunk of chunks) {
            const lines = chunk.substring(0, 100).split(/\d+\.\d{2}/);
            const rawName = lines[0].trim();
            const coreChunk = extractCoreName(rawName);
            
            const chunkWords = coreChunk.split(' ').filter(w => w.length > 2);
            let matchCount = 0;
            
            for (const w of fileWords) {
                if (chunkWords.includes(w) || coreChunk.includes(w)) matchCount++;
            }
            // Add a penalty if chunk has way too many extra words, to avoid matching "Vegetable Biriyani" to "Vegetable Cutlet Family"
            
            if (matchCount >= fileWords.length - 1 && matchCount > highestScore) {
                highestScore = matchCount;
                
                // extract price
                const priceMatch = chunk.substring(0, 150).match(/(\d+\.\d{2})/);
                bestMatch = {
                    originalFile: file,
                    pdfName: rawName.substring(0, 80),
                    price: priceMatch ? priceMatch[1] : "N/A"
                };
            }
        }
        
        if (bestMatch && highestScore > 0) {
            found.push(bestMatch);
        } else {
            notFound.push(file);
        }
    }
    
    let output = `# PDF Mapping Report for 60 Unmatched Images\\n\\n`;
    output += `## 🟢 Found in PDF (Not in Sanity)\\n`;
    found.forEach(f => {
        output += `- **Image**: \`${f.originalFile}\`\\n  ➔ **Product**: \`${f.pdfName}\`\\n  ➔ **Price**: £${f.price}\\n\\n`;
    });
    
    output += `## 🔴 NOT Found in PDF At All\\n`;
    notFound.forEach(f => {
        output += `- \`${f}\`\\n`;
    });
    
    fs.writeFileSync(path.join(process.cwd(), "implementation_plan.md"), output);
    console.log("Wrote mapping to implementation_plan.md");
});

const pdfPath = path.join(process.cwd(), "products-ref", "AVAILABLE PRODUCT LIST IAF.pdf");
pdfParser.loadPDF(pdfPath);

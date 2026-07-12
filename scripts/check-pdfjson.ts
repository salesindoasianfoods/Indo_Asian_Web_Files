import * as fs from "fs";
import * as path from "path";
import PDFParser from "pdf2json";

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
    
    const lines = fullText.split(' Sale Price ')[1]?.split(/\s{5,}/) || fullText.split(/(?=\bVS|\bVIS|\bDD|\bMC)/); // Simple heuristic to split products since it's just raw text
    
    // Actually, since pdf2json returns text mixed up, we'll just check if the core words exist close to each other in the FULL TEXT.
    
    const matched = [];
    const unmatched = [];
    
    const cleanFullText = extractCoreName(fullText);
    
    for (const file of unmatchedFiles) {
        const filenameWithoutExt = path.parse(file).name;
        const coreFileName = extractCoreName(filenameWithoutExt);
        const words = coreFileName.split(' ').filter(w => w.length > 2);
        
        let matchCount = 0;
        for (const w of words) {
            if (cleanFullText.includes(w)) matchCount++;
        }
        
        if (words.length > 0 && matchCount >= words.length - 1 && matchCount > 0) {
            matched.push(`- **${file}** -> Found in Document!`);
        } else {
            unmatched.push(`- **${file}**`);
        }
    }
    
    console.log("=== FOUND IN DOCUMENT ===");
    matched.forEach(m => console.log(m));
    
    console.log("\n=== NOT FOUND IN DOCUMENT ===");
    unmatched.forEach(u => console.log(u));
});

const pdfPath = path.join(process.cwd(), "products-ref", "AVAILABLE PRODUCT LIST IAF.pdf");
pdfParser.loadPDF(pdfPath);

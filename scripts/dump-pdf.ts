import * as fs from "fs";
import * as path from "path";
import PDFParser from "pdf2json";

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", (errData: any) => console.error(errData) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    let fullText = "";
    for (let page of pdfData.Pages.slice(2, 4)) {
        for (let t of page.Texts) {
            try {
                fullText += decodeURIComponent(t.R[0].T) + " ";
            } catch (e) {
                fullText += t.R[0].T + " ";
            }
        }
    }
    fs.writeFileSync("pdf-dump.txt", fullText);
    console.log("Dumped pdf to pdf-dump.txt");
});

const pdfPath = path.join(process.cwd(), "products-ref", "AVAILABLE PRODUCT LIST IAF.pdf");
pdfParser.loadPDF(pdfPath);


import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const essays = [
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_GKS_Gold_Standard_Awardees/GKS_S2_ENGINEERING_ UNIVERSITY OF KOOKMIN.pdf",
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_LPDP_Gold_Standard_Awardees/LPDP_DEVELOPMENT & RURAL INNOVATION_WAGENINGEN UNIVERSITY & RESEARCH.pdf",
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_LPDP_Gold_Standard_Awardees/LPDP_S2_ENVIRONMENTAL SCIENCE_UNIVERSITY OF QUEENSLAND.pdf",
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_LPDP_Gold_Standard_Awardees/LPDP_S2_TESOL_MONASH UNIVERSITY.pdf"
];

async function extractText(pdfPath) {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument(data);
    const pdfDocument = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + "\n";
    }
    return fullText;
}

async function main() {
    for (const pdfPath of essays) {
        console.log(`--- START OF ESSAY: ${path.basename(pdfPath)} ---`);
        try {
            const text = await extractText(pdfPath);
            console.log(text);
        } catch (e) {
            console.error(`Error reading ${pdfPath}:`, e);
        }
        console.log(`--- END OF ESSAY: ${path.basename(pdfPath)} ---`);
    }
}

main();

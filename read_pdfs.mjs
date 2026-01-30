
import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const KNOWLEDGE_BASE_DIRS = [
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_GKS_Gold_Standard_Awardees",
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_LPDP_Gold_Standard_Awardees"
];

function getPdfFiles(directories) {
    let pdfFiles = [];
    for (const dir of directories) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (file.toLowerCase().endsWith('.pdf')) {
                    pdfFiles.push(path.join(dir, file));
                }
            }
        } else {
            console.warn(`Directory not found: ${dir}`);
        }
    }
    return pdfFiles;
}

const essays = getPdfFiles(KNOWLEDGE_BASE_DIRS);

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

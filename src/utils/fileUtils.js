import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

// Configure PDF.js worker using local Vite asset URL for maximum speed
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts text from a File object (PDF, DOCX, or TXT)
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractTextFromFile = async (file) => {
    const lowerName = file.name.toLowerCase();

    // PDF
    if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
        try {
            const startTime = performance.now();
            console.log(`Starting PDF extraction for: ${file.name}`);

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc // Ensure it uses the set worker
            }).promise;

            console.log(`PDF Loaded. Pages: ${pdf.numPages}. Time: ${Math.round(performance.now() - startTime)}ms`);

            // Parallelize page text extraction
            const pagePromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pagePromises.push(
                    pdf.getPage(i).then(async (page) => {
                        const textContent = await page.getTextContent();
                        return textContent.items.map(item => item.str).join(' ');
                    })
                );
            }

            const pagesText = await Promise.all(pagePromises);
            const totalTime = Math.round(performance.now() - startTime);
            console.log(`PDF extraction completed in ${totalTime}ms`);
            return pagesText.join('\n');
        } catch (error) {
            console.error("PDF Extraction Failed:", error);
            throw new Error("Gagal membaca file PDF.");
        }
    }

    // DOCX
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error("DOCX Extraction Failed:", error);
            throw new Error("Gagal membaca file DOCX.");
        }
    }

    // TXT
    if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
        return await file.text();
    }

    throw new Error("Format file tidak didukung. Gunakan PDF, DOCX, atau TXT.");
};

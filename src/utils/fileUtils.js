import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Reverting to the "prior formula" using a reliable CDN for the worker
// Version 5.4.624 requires the .mjs extension for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`;

/**
 * Extracts text from a File object (PDF, DOCX, or TXT)
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractTextFromFile = async (file) => {
    const lowerName = file.name.toLowerCase();
    const startTime = performance.now();

    // Safety timeout expanded to 180s for large files
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Waktu ekstraksi habis (180 detik).")), 180000);
    });

    const extractionPromise = (async () => {
        // PDF
        if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
            try {
                console.log(`[PDF] Starting sequential extraction: ${file.name}`);
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';

                    if (i % 5 === 0 || i === pdf.numPages) {
                        console.log(`[PDF] Progress: ${i}/${pdf.numPages} pages`);
                    }
                }
                return fullText;
            } catch (error) {
                console.error("[PDF] Sequential Extraction Failed:", error);
                throw new Error(`Gagal membaca PDF: ${error.message}`);
            }
        }

        // DOCX
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                return result.value;
            } catch (error) {
                throw new Error("Gagal membaca DOCX.");
            }
        }

        // TXT
        if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
            return await file.text();
        }

        throw new Error("Format file tidak didukung.");
    })();

    return Promise.race([extractionPromise, timeoutPromise]);
};

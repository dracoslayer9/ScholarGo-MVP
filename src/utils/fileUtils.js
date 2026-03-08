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
    const startTime = performance.now();

    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Extraction timed out after 10 seconds")), 10000);
    });

    const extractionPromise = (async () => {
        // PDF
        if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
            try {
                console.log(`[PDF] Starting extraction for: ${file.name} (${file.size} bytes)`);

                const arrayBuffer = await file.arrayBuffer();
                console.log(`[PDF] ArrayBuffer ready: ${Math.round(performance.now() - startTime)}ms`);

                // Use a more robust document loading with range and stream disabled for speed
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
                    disableRange: true,
                    disableStream: true,
                    useSystemFonts: true // Speed up text fetching
                });

                const pdf = await loadingTask.promise;
                console.log(`[PDF] Document loaded. Pages: ${pdf.numPages}. Time: ${Math.round(performance.now() - startTime)}ms`);

                // Parallelize page text extraction with chunking if needed, but for small files we just DO IT
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
                console.log(`[PDF] Extraction completed in ${totalTime}ms`);
                return pagesText.join('\n');
            } catch (error) {
                console.error("[PDF] Extraction Failed:", error);
                throw error;
            }
        }

        // DOCX
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) {
            try {
                console.log(`[DOCX] Starting extraction for: ${file.name} (${file.size} bytes)`);
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                console.log(`[DOCX] Extraction completed in ${Math.round(performance.now() - startTime)}ms`);
                return result.value;
            } catch (error) {
                console.error("[DOCX] Extraction Failed:", error);
                throw error;
            }
        }

        // TXT
        if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
            return await file.text();
        }

        throw new Error("Format file tidak didukung. Gunakan PDF, DOCX, atau TXT.");
    })();

    return Promise.race([extractionPromise, timeoutPromise]);
};

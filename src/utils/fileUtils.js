import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker using CDN for maximum reliability across environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

// Global error handler for worker failures
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('pdf.worker')) {
            console.error('[PDF] Critical Worker Error detected:', event.reason);
        }
    });
}

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
                console.log(`[PDF] Loading document with worker: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
                    disableRange: true,
                    disableStream: true,
                    useSystemFonts: true
                });

                const pdf = await loadingTask.promise;
                console.log(`[PDF] Document loaded. Pages: ${pdf.numPages}. Time: ${Math.round(performance.now() - startTime)}ms`);

                // Parallelize page text extraction with chunking if needed, but for small files we just DO IT
                const pagePromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    pagePromises.push(
                        pdf.getPage(i).then(async (page) => {
                            const textContent = await page.getTextContent();
                            // Handle potential spacing issues between items
                            return textContent.items.map(item => item.str).join(' ');
                        })
                    );
                }

                const pagesText = await Promise.all(pagePromises);
                const totalText = pagesText.join('\n');
                const totalTime = Math.round(performance.now() - startTime);
                console.log(`[PDF] Extraction completed in ${totalTime}ms. Text length: ${totalText.length}`);

                if (!totalText.trim()) {
                    console.warn("[PDF] Extracted text is empty. Might be a scanned document.");
                }

                return totalText;
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
                const totalTime = Math.round(performance.now() - startTime);
                console.log(`[DOCX] Extraction completed in ${totalTime}ms. Text length: ${result.value?.length || 0}`);
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

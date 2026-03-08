// Configure PDF.js worker using CDN - match the version in package.json for perfect compatibility
// Using .mjs for v5+ as it's the new standard
const PDFJS_VERSION = '5.4.624';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

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

    // Create a timeout promise to prevent hanging - expanded to 60s to confirm if it EVER finishes
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Waktu ekstraksi habis (60 detik). Mungkin ada kendala pada pemrosesan file.")), 60000);
    });

    const extractionPromise = (async () => {
        // PDF
        if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
            try {
                console.log(`[PDF] Starting extraction for: ${file.name} (${file.size} bytes)`);

                const arrayBuffer = await file.arrayBuffer();
                console.log(`[PDF] ArrayBuffer ready: ${Math.round(performance.now() - startTime)}ms`);

                // Simplify loading options - some older browsers/hostings struggle with range/stream
                console.log(`[PDF] Loading document...`);
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer
                });

                const pdf = await loadingTask.promise;
                console.log(`[PDF] Document loaded. Pages: ${pdf.numPages}. Time: ${Math.round(performance.now() - startTime)}ms`);

                // EXTRACTION: Sequential processing is much safer for memory and avoids worker hangs
                let totalText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    try {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        totalText += pageText + '\n';

                        // Log progress for large files
                        if (i % 5 === 0 || i === pdf.numPages) {
                            console.log(`[PDF] Extraction progress: ${i}/${pdf.numPages} pages`);
                        }
                    } catch (pageErr) {
                        console.warn(`[PDF] Failed to extract page ${i}:`, pageErr);
                        totalText += `\n[Error pada halaman ${i}]\n`;
                    }
                }

                const totalTime = Math.round(performance.now() - startTime);
                const totalTime = Math.round(performance.now() - startTime);
                console.log(`[PDF] Extraction completed in ${totalTime}ms. Text length: ${totalText.length}`);

                if (!totalText.trim()) {
                    console.warn("[PDF] Extracted text is empty. Might be a scanned document.");
                }

                return totalText;
            } catch (error) {
                console.error("[PDF] Extraction Failed:", error);
                throw new Error(`Gagal membaca PDF: ${error.message || 'Error tidak dikenal'}`);
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
                throw new Error(`Gagal membaca DOCX: ${error.message || 'Error tidak dikenal'}`);
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

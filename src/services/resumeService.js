import { sendChatMessage } from './analysis';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Reverting to the "prior formula" using a reliable CDN for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`;

/**
 * Extracts text content from a PDF file
 * @param {File} file - The PDF file object
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw new Error("Failed to read PDF file.");
    }
};

/**
 * Extracts text from a file (supports PDF, Docx, and TXT)
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractResumeText = async (file) => {
    if (file.type === 'application/pdf') {
        return await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } else if (file.type === 'text/plain') {
        return await file.text();
    } else {
        throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
    }
};

/**
 * Parses resume text into structured JSON using AI
 * @param {string} resumeText 
 * @returns {Promise<Object>}
 */
export const parseResumeWithAI = async (resumeText) => {
    const prompt = `
Tugas Anda adalah mengekstrak teks mentah dari resume pengguna menjadi profil JSON yang terstruktur (ATS Standard) dan strategis untuk pembuatan esai beasiswa.

Teks Resume: 
${resumeText.substring(0, 5000)}

EKSTRAK DATA BERIKUT:
1. Data Pribadi (Nama Lengkap).
2. Ringkasan Profesional: Buat label 2-3 kata (misal: "Social Innovator").
3. Pendidikan Terakhir: Institusi, Jurusan, IPK (jika ada).
4. Pengalaman Relevan: 2-3 posisi terbaru/terpenting dengan pencapaian kunci.
5. Skill Unggulan: Daftar 5 skill teknis/soft skill.
6. GAP ANALYSIS: Identifikasi 1 area narasi yang "tidak ada" di resume tapi krusial untuk beasiswa (misal: Alasan emosional memilih jurusan, atau visi 10 tahun ke depan).

FORMAT OUTPUT (JSON):
{
  "full_name": "string",
  "ai_identity": "string",
  "education": { "institution": "string", "major": "string", "gpa": "string" },
  "experience": [
    { "title": "string", "org": "string", "achievement": "string" }
  ],
  "top_skills": ["string"],
  "suggested_bridge_question": "Satu pertanyaan mendalam untuk menggali 'Why' user"
}
    `;

    try {
        // Create a timeout promise (15 seconds)
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timed out")), 15000)
        );

        // Race the API call against the timeout
        const response = await Promise.race([
            sendChatMessage(prompt, [], "", null, "gpt-4o-mini"),
            timeout
        ]);

        // Clean markdown code blocks if present
        const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        if (error.message === "Analysis timed out") {
            throw new Error("Analysis took too long. Please try a shorter resume or check your connection.");
        }
        throw new Error("Failed to analyze resume. Please try again.");
    }
};

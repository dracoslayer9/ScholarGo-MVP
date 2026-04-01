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
7. AGENTIC RESEARCH: Berdasarkan profil ini, sarankan 3 kombinasi "Universitas & Jurusan" terbaik di dunia yang cocok dengan latar belakang user. Sertakan alasan singkat kenapa portfolio user kuat untuk jurusan tersebut.
8. PORTFOLIO HIGHLIGHTS: Sebutkan 2-3 poin spesifik dari resume yang paling mendukung visi user.

FORMAT OUTPUT (JSON):
{
  "full_name": "string",
  "ai_identity": "string",
  "education": { "institution": "string", "major": "string", "gpa": "string" },
  "experience": [
    { "title": "string", "org": "string", "achievement": "string" }
  ],
  "top_skills": ["string"],
  "uni_major_suggestions": [
    { "uni": "string", "major": "string", "reason": "string" }
  ],
  "portfolio_match": ["string"],
  "suggested_bridge_question": "Satu pertanyaan mendalam mengenai 'Why' user yang mencakup:\n- Jurusan yang Anda incar & apa hal spesifik yang ingin Anda pelajari di sana?\n- Rencana karir masa depan & impact sosialnya\n- Visi emosional (apa yang paling menggerakkan hati Anda?)\n\nSertakan instruksi agar user menjawab poin-poin tersebut, dan berikan 3 bullet points contoh jawaban yang singkat namun sangat inspiratif."
}
    `;

    try {
        // Create a timeout promise (15 seconds)
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timed out")), 15000)
        );

        // Race the API call against the timeout
        // 3. Robust JSON Extraction
        const response = await Promise.race([
            sendChatMessage(prompt, [], "", null, "gpt-4o"), // Upgrade to gpt-4o for complex strategy
            timeout
        ]);

        console.log("AI Analysis Raw Response:", response); // Debugging

        try {
            // Find JSON block with regex to handle cases where AI adds chatter
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : response;
            return JSON.parse(jsonString);
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr, "Content:", response);
            throw new Error("Failed to parse analysis result. The AI response was not in expected format.");
        }
    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        if (error.message === "Analysis timed out") {
            throw new Error("Analysis took too long. Please try a shorter resume or check your connection.");
        }
        throw new Error("Failed to analyze resume. Please try again.");
    }
};

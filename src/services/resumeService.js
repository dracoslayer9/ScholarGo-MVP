import { sendChatMessage } from './analysis';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
 * Extracts text from a file (supports PDF and TXT)
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const extractResumeText = async (file) => {
    if (file.type === 'application/pdf') {
        return await extractTextFromPDF(file);
    } else if (file.type === 'text/plain') {
        return await file.text();
    } else {
        throw new Error("Unsupported file type. Please upload PDF or TXT.");
    }
};

/**
 * Parses resume text into structured JSON using AI
 * @param {string} resumeText 
 * @returns {Promise<Object>}
 */
export const parseResumeWithAI = async (resumeText) => {
    const prompt = `
Tugas Anda adalah mengekstrak teks mentah dari resume pengguna menjadi profil JSON yang terstruktur dan strategis.

Teks Resume Pengguna: 
${resumeText.substring(0, 5000)} // Limit context to avoid token issues

Tugas Anda:

Keahlian Utama: Identifikasi 3 keahlian paling dominan yang relevan dengan aplikasi beasiswa atau pengembangan karir tingkat lanjut.

Pengalaman Terakhir: Ambil detail jabatan, organisasi, dan satu pencapaian kunci dari posisi terbaru.

Format Output (HANYA JSON): { "full_name": "string", "top_skills": ["skill1", "skill2", "skill3"], "latest_experience": { "title": "string", "organization": "string", "key_achievement": "string" }, "social_problem_context": { "problem_statement": "string", "relevance_score": 1-10 }, "ai_identity_label": "string (misal: Digital Innovator/Policy Strategist)" }

Instruksi Ketat: Jangan berikan penjelasan teks apa pun sebelum atau sesudah JSON. Pastikan JSON valid dan siap disimpan ke tabel Supabase.
    `;

    try {
        // We use sendChatMessage as a generic "ask AI" function
        // Pass empty history, resume text as context, 'openai' as provider
        const response = await sendChatMessage(prompt, [], "", "openai");

        // Clean markdown code blocks if present
        const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        throw new Error("Failed to analyze resume. Please try again.");
    }
};

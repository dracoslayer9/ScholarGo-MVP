import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env or .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to bypass RLS

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing necessary environment variables (OpenAI API Key, Supabase URL, or Service Role Key).");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const KNOWLEDGE_BASE_DIRS = [
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_GKS_Gold_Standard_Awardees",
    "/Users/macbookair/KNOWLEDGE_BASE/Essay_LPDP_Gold_Standard_Awardees",
    "/Users/macbookair/KNOWLEDGE_BASE/Personal Statement_GKS_Gold_Standard_Awardees",
    "/Users/macbookair/KNOWLEDGE_BASE/Personal Statement_LPDP_Gold_Standard_Awardees"
];

function getPdfFiles(directories) {
    let pdfFiles = [];
    for (const dir of directories) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (file.toLowerCase().endsWith('.pdf')) {
                    // Determine scholarship and document type from directory structure/filename
                    const scholarship_type = dir.includes('LPDP') ? 'LPDP' : dir.includes('GKS') ? 'GKS' : 'Other';
                    const document_type = dir.includes('Personal Statement') ? 'Personal Statement' : 'Essay';

                    pdfFiles.push({
                        path: path.join(dir, file),
                        filename: file,
                        scholarship_type,
                        document_type
                    });
                }
            }
        } else {
            console.warn(`Directory not found: ${dir}`);
        }
    }
    return pdfFiles;
}

const essays = getPdfFiles(KNOWLEDGE_BASE_DIRS);

async function extractPdfText(pdfPath) {
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

async function anonymizeAndExtractStrategy(rawText) {
    const prompt = `Anda adalah seorang ahli analis bahasa dan akademisi.
    Tugas Anda adalah membaca esai aplikasi beasiswa pemenang (awardee) ini, dan mengekstrak STRATEGI PENULISAN serta LOGIKA ARGUMEN mereka.

    ATURAN MUTLAK (SANGAT PENTING):
    1. HAPUS 100% semua Informasi Identifikasi Pribadi (PII) seperti: Nama pelamar, Kampus spesifik (ganti jadi [Universitas Tujuan]), Negara tujuan (jika terlalu spesifik, ganti jadi [Negara Tujuan]), Daerah Asal, Nama Perusahaan Tempat Bekerja.
    2. Ekstrak teks ke dalam format bahasa Indonesia yang baku dan terstruktur.
    3. Fokuslah pada BAGAIMANA pelamar menulis (Misal: "Pada paragraf pembuka, pelamar menggunakan pendekatan X untuk menyoroti masalah Y").
    4. Ringkaslah taktik jitu apa yang membuat esai ini sukses (Struktur Gap-Bridge-Vision).

    Teks Asli Esai:
    """
    ${rawText.substring(0, 15000)} // Truncate to avoid massive token limits just in case
    """

    Berikan hasil analisis taktik penulisan anonim Anda di bawah ini:`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
    });

    return response.choices[0].message.content;
}

async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        input: text,
        model: 'text-embedding-3-small',
    });
    return response.data[0].embedding;
}

async function main() {
    console.log(`Found ${essays.length} PDFs to process.`);

    for (const doc of essays) {
        console.log(`\n\n⬇️ Processing: ${doc.filename}`);
        try {
            // 1. Extract Text
            console.log(`   - Extracting raw text from PDF...`);
            const rawText = await extractPdfText(doc.path);

            // 2. Anonymize & Extract Strategy (GPT-4o-mini)
            console.log(`   - Anonymizing and extracting writing strategies...`);
            const sanitizedContent = await anonymizeAndExtractStrategy(rawText);

            // 3. Generate Embedding
            console.log(`   - Generating vector embedding (text-embedding-3-small)...`);
            const embedding = await getEmbedding(sanitizedContent);

            // 4. Save to Supabase
            console.log(`   - Saving to Supabase knowledge_base table...`);
            const { error } = await supabase
                .from('knowledge_base')
                .insert({
                    scholarship_type: doc.scholarship_type,
                    document_type: doc.document_type,
                    original_filename: doc.filename,
                    anonymized_content: sanitizedContent,
                    embedding: embedding
                });

            if (error) {
                console.error(`   ❌ Supabase Insert Error for ${doc.filename}:`, error);
            } else {
                console.log(`   ✅ Successfully ingested ${doc.filename}`);
            }

            // Sleep briefly to avoid aggressive rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (e) {
            console.error(`   ❌ Fatal Error processing ${doc.filename}:`, e);
        }
    }
    console.log("\n🎉 Knowledge Base Ingestion Complete!");
}

main();

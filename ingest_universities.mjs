import fs from 'fs';
import csv from 'csv-parser';
import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TAVILY_API_KEY) {
    console.error("Missing env vars. Ensure TAVILY_API_KEY, OPENAI_API_KEY, and SUPABASE keys are set in .env.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const tvly = tavily({ apiKey: TAVILY_API_KEY });

const results = [];

fs.createReadStream('kampus_target.csv')
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`Loaded ${results.length} universities to process.`);
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const { University_Name, Country, Target_Major, Focus_Area_Keywords } = row;

            console.log(`\n[${i + 1}/${results.length}] Processing: ${University_Name} - ${Target_Major}`);

            try {
                // 1. Ask Tavily to search
                const query = `Syllabus, top professors, and research focus for ${Target_Major} at ${University_Name}, ${Country}. Keywords: ${Focus_Area_Keywords}`;
                console.log(`   - Searching Tavily...`);
                const searchResult = await tvly.search(query, {
                    searchDepth: "advanced",
                    includeRawContent: false,
                    maxResults: 3
                });

                const searchContext = searchResult.results.map(r => r.content).join('\n\n');

                // 2. Ask OpenAI to summarize
                console.log(`   - Summarizing with GPT-4o-mini...`);
                const prompt = `You are an elite academic counselor. Based on the following Web Search Context, create a highly structured, single paragraph "Curated Profile" for this university program.
            
            Target Program: ${Target_Major} at ${University_Name}, ${Country}
            Focus Areas: ${Focus_Area_Keywords}
            
            Requirements for the paragraph:
            1. Overview of the program's unique strength.
            2. Name 1-2 top professors and their research focus (only if specifically mentioned in the web context).
            3. Explain why this aligns beautifully with developing-nation students (like Indonesia).
            
            Web Search Context:
            """
            ${searchContext}
            """
            
            Output ONLY the curated profile paragraph. Ensure it is highly professional and analytical.`;

                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                });
                const curatedProfile = completion.choices[0].message.content;

                // 3. Generate Embedding
                console.log(`   - Generating embedding...`);
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: curatedProfile,
                });
                const embedding = embeddingResponse.data[0].embedding;

                // 4. Save to Supabase
                console.log(`   - Saving to database...`);
                const { error } = await supabase
                    .from('university_knowledge_base')
                    .insert({
                        university_name: University_Name,
                        country: Country,
                        target_major: Target_Major,
                        focus_area: Focus_Area_Keywords,
                        curated_profile: curatedProfile,
                        embedding: embedding
                    });

                if (error) {
                    console.error(`   ❌ Supabase Insert Error:`, error);
                } else {
                    console.log(`   ✅ Success!`);
                }

                // Sleep to avoid rate limits
                await new Promise(r => setTimeout(r, 1500));

            } catch (err) {
                console.error(`   ❌ Failed to process ${University_Name}:`, err.message || err);
            }
        }
        console.log(`\n🎉 All ${results.length} universities processed!`);
    });

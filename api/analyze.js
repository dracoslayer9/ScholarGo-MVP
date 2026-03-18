/* eslint-env node */
/* global process */
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY in server environment variables.' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { text, type = "General Essay", instruction, context } = req.body;

    // Validate inputs
    if (!text && !instruction) {
      return res.status(400).json({ error: "Text or instruction is required" });
    }

    console.log("Processing analysis request:", { type, instructionPresent: !!instruction });

    // Pre-process text with line numbers for accurate citation
    const textWithLines = (text || '').split('\n').map((line, i) => `Line ${i + 1}: ${line}`).join('\n');

    // --- IMPROVED PARAGRAPH EXTRACTION (V2 LINE-BASED) ---
    const lines = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
    let segmentedParagraphs = [];
    let currentHeader = null;
    let pCount = 0;
    let currentParagraphLines = [];

    const flushParagraph = () => {
        if (currentParagraphLines.length > 0) {
            pCount++;
            segmentedParagraphs.push({
                index: pCount,
                header: currentHeader,
                content: currentParagraphLines.join('\n')
            });
            currentParagraphLines = [];
            currentHeader = null;
        }
    };

    lines.forEach((line) => {
        if (!line) {
            flushParagraph();
            return;
        }
        const looksLikeHeader = line.length < 60 && !/[.!?]$/.test(line) && line.split(' ').length < 10;
        if (looksLikeHeader && currentParagraphLines.length === 0) {
            currentHeader = currentHeader ? `${currentHeader} / ${line}` : line;
        } else {
            currentParagraphLines.push(line);
        }
    });
    flushParagraph();

    if (currentHeader) {
        pCount++;
        segmentedParagraphs.push({ index: pCount, header: currentHeader, content: "" });
    }

    const textWithMarkers = segmentedParagraphs.map((p) => {
        let s = `### PARAGRAPH ${p.index} ###\n`;
        if (p.header) s += `[HEADER/TITLE: ${p.header}]\n`;
        return s + (p.content || "(No content paragraph)");
    }).join('\n\n');

    let systemPrompt = `You are an elite academic scholarship consultant. Analyze the document structure.
    
    **LANGUAGE INSTRUCTION**:
    DETECT the language of the provided document or the user's instruction. You MUST provide your analysis in the **SAME LANGUAGE**. 
    - If the document/query is in **Indonesian**, the textual values of your JSON response MUST be in **Indonesian**.
    - If the document/query is in **English**, reply entirely in **English**.
    - CRITICAL: DO NOT translate the JSON keys. Only translate the string content values!

    ${type === "Awardee Sample" ? `
    **AWARDEE DISSECTION MODE**:
    This document is a SUCCESSFUL awardee essay. deconstruct its winning anatomy.
    ` : `
    **CRITIQUE MODE**:
    This is a student draft. Analyze it rigorously.
    `}

    **STRICT WORKFLOW**:
    1. You are provided with ${segmentedParagraphs.length} paragraphs, each marked with ### PARAGRAPH X ###.
    2. You MUST return EXACTLY ${segmentedParagraphs.length} objects in the "paragraphBreakdown" array.
    3. One object per paragraph. DO NOT combine them.
    4. Cite the markers accurately.
    
    **PARAGRAPH ANALYSIS CRITERIA**:
    For EACH paragraph, provide:
    - **Paragraph Number**: Sequential integer (match the markers).
    - **Detected Subtitle**: The [HEADER/TITLE] if provided, else null.
    - **Functional Label**: Infer role (e.g. Hook, Context, Challenge, Growth).
    - **Main Idea**: One sentence summary of content.
    - **Current Approach**: What is this paragraph trying to do structurally?
    - **Evidence Quote**: Real verbatim quote from the text.
    `;

    if (instruction) {
      systemPrompt += `\n\nUser Instruction: ${instruction}`;
      if (context) {
        systemPrompt += `\n\nSpecific Context/Excerpt to Apply Instruction to: "${context}"`;
      }
    }

    let ragContext = "";
    if (text && text.trim().length > 50 && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text.substring(0, 3000),
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        const { data: matchedEssays, error } = await supabase.rpc('match_knowledge_base', {
          query_embedding: queryEmbedding,
          match_threshold: 0.50,
          match_count: 1
        });

        if (!error && matchedEssays && matchedEssays.length > 0) {
          ragContext = `\n\n**PROACTIVE RAG CONTEXT (AWARDEE GOLD STANDARD)**:
Here is an anonymized writing strategy from a real, successful awardee that is highly relevant to this document. 
USE THIS EXTRACTED STRATEGY to influence your analysis, especially in the 'strategicImprovements' array. Provide concrete examples of winning narrative structures.

--- AWARDEE STRATEGY ---
${matchedEssays[0].anonymized_content}
------------------------
`;
        }
      } catch (err) {
        console.error("Proactive RAG Error:", err);
      }
    }

    const prompt = `
      ${systemPrompt}
      ${ragContext}
      
      Return the response in this strict JSON format:
      {
        "documentClassification": {
          "primaryType": "Personal Statement | Study Plan | Portfolio",
          "secondaryElements": ["e.g. Research Methodology"],
          "reasoning": "Brief explanation.",
          "confidence": "High | Medium | Low",
          "structuralSignals": ["signal 1", "signal 2"]
        },
        "deepAnalysis": {
          "overallAssessment": "High-level assessment.",
          "authenticity": { "strengths": "...", "evidence": "..." },
          "structure": { "type": "...", "flow": "..." },
          "values": { "detectedValues": "...", "alignment": "..." },
          "strategicImprovements": ["${type === 'Awardee Sample' ? 'Takeaway 1' : 'Imp 1'}", "${type === 'Awardee Sample' ? 'Takeaway 2' : 'Imp 2'}"]
        },
        "globalSummary": "A 2-3 sentence global summary.",
        "paragraphBreakdown": [
          { 
            "paragraph_number": 1,
            "detected_subtitle": "Subtitle from text (or null)",
            "functional_label": "e.g. Hook",
            "section_label": "e.g. Introduction/Hook",
            "analysis_current": "What this specific paragraph does.",
            "main_idea": "Summary of this specific paragraph.",
            "evidence_quote": "<EXTRACT_REAL_VERBATIM_QUOTE_FROM_THIS_PARAGRAPH>",
            "evidence_location": "Lines X-Y",
            "strength": "Observation.",
            "status": "strong" 
          }
        ]
      }

      **STRICT DATA INTEGRITY RULES**:
      1. **NO PLACEHOLDERS**: Never use the phrase "Exact verbatim quote." or any other filler text. You MUST extract the actual words from the "Essay Content" provide below.
      2. **FULL PARAGRAPH ANALYSIS**: Analyze EVERY SINGLE paragraph in the text. DO NOT Skip. If there are 10 paragraphs, provide 10 objects in the array.
      3. **LANGUAGE MATCHING**: Reply in the SAME language as the user's document or query. If document is Indonesian, JSON values must be Indonesian (keys stay English).

      IMPORTANT: Analyze EVERY SINGLE paragraph in the text. 
      You MUST return an array containing one exact object for each paragraph.
      DO NOT summarize multiple paragraphs into one. If there are 15 paragraphs in the text, you MUST output exactly 15 elements in the paragraphBreakdown array.
      FAILURE to provide real quotes or complete paragraph analysis will be penalized.
      
      Essay Content with Line Numbers:
      "${textWithLines}"
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });


    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Received empty response from OpenAI.");
    }

    // Try to parse locally to ensure validity before sending back, though user code handles string too
    try {
      JSON.parse(content);
    } catch {
      console.error("Generated content is not valid JSON:", content);
      // We still send it back as result string, client handles parsing or fallback
    }

    return res.status(200).json({ result: content });

  } catch (error) {
    console.error("Server Analysis Error:", error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error.message || 'Internal Server Error',
      details: error.error || null
    });
  }
}

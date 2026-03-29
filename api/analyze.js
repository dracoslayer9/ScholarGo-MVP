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

    // --- IMPROVED PARAGRAPH EXTRACTION (V3 ROBUST) ---
    const lines = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
    let segmentedParagraphs = [];
    let currentHeader = null;
    let pCount = 0;
    let currentParagraphLines = [];

    const flushParagraph = () => {
        // Only flush if we have content OR if we have a header that stayed alone at the end
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

        // HEURISTIC: Is this a header?
        const isMarkdownHeader = line.startsWith('#');
        const isBoldHeader = line.startsWith('**') && line.endsWith('**') && line.length < 100;
        const isAllCaps = line.length > 3 && line === line.toUpperCase() && !/[.!?]$/.test(line);
        const isShortLabel = line.length < 60 && !/[.!?]$/.test(line) && line.split(' ').length < 10;
        
        const looksLikeHeader = isMarkdownHeader || isBoldHeader || isAllCaps || isShortLabel;

        // If it looks like a header and we haven't started paragraph content yet, collect it as a header
        if (looksLikeHeader && currentParagraphLines.length === 0) {
            currentHeader = currentHeader ? `${currentHeader} | ${line}` : line;
        } else {
            // It's content
            currentParagraphLines.push(line);
        }
    });
    
    // Final flush
    flushParagraph();

    // If we have a trailing header with no content, attach it to the LAST paragraph or as a final block
    if (currentHeader) {
        if (segmentedParagraphs.length > 0) {
            // Attach as extra footer to previous
            segmentedParagraphs[segmentedParagraphs.length - 1].content += `\n\n[FOOTER/TITLE: ${currentHeader}]`;
        } else {
            // Rare: Only a header in the whole doc
            pCount++;
            segmentedParagraphs.push({ index: pCount, header: currentHeader, content: "(No content provided)" });
        }
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
    
    **STRICT DEPTH PROTOCOL**:
    - **NO BREVITY**: Do not provide one-sentence responses for structural analysis or main ideas.
    - **CRITICAL THINKING**: You MUST provide at least 3-4 sentences per paragraph for both 'Current Approach' and 'Main Idea'.
    - **SUBSTANCE**: Explain the 'why' and the 'how'. If a paragraph is a hook, explain what kind of hook it is (sensory, thematic, question-based) and how it creates tension or curiosity.

    **PARAGRAPH ANALYSIS CRITERIA**:
    For EACH paragraph, provide:
    - **Paragraph Number**: Sequential integer (match the markers).
    - **Detected Subtitle**: The [HEADER/TITLE] if provided, else null.
    - **Functional Label**: Infer role (e.g. Phase 1: Hook, Phase 2: Track Record).
    - **Main Idea**: A thorough, NUANCED, and multi-sentence summary (min 3 sentences) of the paragraph's core idea.
    - **Current Approach**: A detailed, 3-4 sentence structural analysis of how this paragraph functions, its logic, and its alignment with scholarship standards.
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
          "reasoning": "Detailed reasoning exploring why the document falls into this category, citing specific structural elements.",
          "confidence": "High | Medium | Low",
          "structuralSignals": ["signal 1", "signal 2"]
        },
        "deepAnalysis": {
          "overallAssessment": "Comprehensive evaluation of the essay's strengths, weaknesses, and overall impact.",
          "authenticity": { "strengths": "...", "evidence": "..." },
          "structure": { "type": "...", "flow": "..." },
          "values": { "detectedValues": "...", "alignment": "..." },
          "strategicImprovements": ["Detailed improvement 1", "..."]
        },
        "globalSummary": "A comprehensive 3-5 sentence global summary of the core narrative and potential of this draft.",
        "paragraphBreakdown": [
          { 
            "paragraph_number": 1,
            "detected_subtitle": "Subtitle from text (or null)",
            "functional_label": "e.g. Hook/Context",
            "section_label": "e.g. Introduction/Hook",
            "analysis_current": "Detailed 3-4 sentence structural analysis. Explaining how this paragraph functions as the [Hook/Context/Gap] and how it transitions to the next point.",
            "main_idea": "A thorough 3-sentence summary that captures the nuance and specific evidence presented in this paragraph.",
            "evidence_quote": "<EXTRACT_REAL_VERBATIM_QUOTE_FROM_THIS_PARAGRAPH>",
            "evidence_location": "Lines X-Y",
            "strength": "Detailed 2-sentence observation on why this paragraph is effective or what makes it a 'winning' element.",
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

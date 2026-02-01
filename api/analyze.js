/* eslint-env node */
/* global process */
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';

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

    let systemPrompt = `You are an elite academic scholarship consultant. Analyze the document structure.
    
    **LANGUAGE INSTRUCTION**:
    DETECT the language of the provided document. You MUST provide your analysis and response in the **SAME LANGUAGE** as the document. 
    - If the document is in **Indonesian**, reply in **Indonesian**.
    - If the document is in **English**, reply in **English**.
    - Do not mix languages unless necessary for terminology.


    **TWO-PHASE PROTOCOL**:
    
    **PHASE 1: Paragraph Extraction**
    1. Read the document (Pay attention to the provided Line Numbers).
    2. Split it into paragraphs.
    3. Number each paragraph sequentially.
    4. Process ALL paragraphs.
    
    **PHASE 2: Paragraph Analysis**
    For EACH paragraph, provide:
    - **Paragraph Number**: Sequential integer.
    - **Detected Subtitle**: Exact subtitle if present, else null.
    - **Functional Label**: Infer role (e.g. Hook, Context, Challenge, Growth).
    - **Main Idea**: One sentence summary of content.
    - **Current Approach**: What is this paragraph trying to do structurally?
    - **Evidence Location**: The specific Line Numbers where this main idea is generated (e.g. "Lines 12-15").

    **Criteria**:
    1. Narrative Authenticity
    2. Structure & Flow
    3. Value Alignment
    `;

    if (instruction) {
      systemPrompt += `\n\nUser Instruction: ${instruction}`;
      if (context) {
        systemPrompt += `\n\nSpecific Context/Excerpt to Apply Instruction to: "${context}"`;
      }
    }

    const prompt = `
      ${systemPrompt}
      
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
          "strategicImprovements": ["Imp 1", "Imp 2", "Imp 3"]
        },
        "globalSummary": "A 2-3 sentence global summary.",
        "paragraphBreakdown": [
          { 
            "paragraph_number": 1,
            "detected_subtitle": "Introduction (or null)",
            "functional_label": "Hook",
            "section_label": "Introduction/Hook",
            "analysis_current": "What the paragraph is currently trying to do (e.g. Introduce the candidate's background).",
            "main_idea": "Summary of content.",
            "evidence_quote": "Exact verbatim quote.",
            "evidence_location": "Lines 12-15",
            "strength": "What works well.",
            "status": "strong" 
          }
        ]
      }

      IMPORTANT: Analyze EVERY paragraph.
      
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

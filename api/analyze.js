import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, type = "General Essay", instruction, context } = req.body;

    // Validate inputs
    if (!text && !instruction) {
      return res.status(400).json({ error: "Text or instruction is required" });
    }

    console.log("Processing analysis request:", { type, instructionPresent: !!instruction });

    let systemPrompt = `You are an elite academic scholarship consultant and admissions evaluator. Your goal is to analyze the document with STRUCTURAL COMPLETENESS.

    **TWO-PHASE PROTOCOL (MANDATORY)**:
    
    **PHASE 1: Paragraph Extraction**
    1. Read the document fully.
    2. Split it into paragraphs (blocks separated by line breaks).
    3. Number each paragraph sequentially (1, 2, 3...).
    4. You MUST process ALL paragraphs exactly once. Do NOT skip any.
    
    **PHASE 2: Paragraph Analysis**
    For EACH paragraph extracted in Phase 1, provide:
    - **Paragraph Number**: The sequential integer.
    - **Detected Subtitle**: If a clear subtitle/heading exists, extract it exactly. If not, return null or empty string.
    - **Functional Label**: Infer the functional role (e.g. Hook, Background, Challenge, Growth, Goals, Conclusion).
    - **Main Idea**: A single concise sentence summarizing the core point.
    - **GAP ANALYSIS**:
        - **Current Goal**: What is this paragraph accurately trying to do *specifically in this text*?
        - **Ideal Goal**: What *should* a paragraph in this position/role be doing for a winning essay?
        - **The Gap**: What is missing or weak between the Current and Ideal?

    **Document Classification Rules**:
    1. **Identify Document Type**: Personal Statement, Study Plan, or Portfolio.
    2. **Infer from Signals**: Content, intent, tone.
    
    **Evaluation Criteria (For Personal Statements/Essays)**:
    1. **Narrative Authenticity**: Authentic life story vs generic achievements.
    2. **Structure & Flow**: Hook, narrative progression, readability.
    3. **Value Alignment**: Alignment with scholarship vision.
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
            "section_label": "Introduction/Hook (Combined Label for UI)",
            "analysis_current": "What the paragraph is currently trying to do (e.g. Introduce the candidate's background).",
            "analysis_ideal": "What it should be doing (e.g. Hook the reader with a compelling specific moment).",
            "analysis_gap": "The gap between them (e.g. Too generic, lacks specific imagery).",
            "main_idea": "Summary of content.",
            "evidence_quote": "Exact quote.",
            "strength": "What works well.",
            "status": "strong" 
          }
        ]
      }

      IMPORTANT: You MUST analyze EVERY single paragraph. The number of items in 'paragraphBreakdown' must match the total paragraph count of the document.
      
      Essay Content:
      "${text || ''}"
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
    } catch (e) {
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

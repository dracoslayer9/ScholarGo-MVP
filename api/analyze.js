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

    let systemPrompt = `You are an elite academic scholarship consultant (like a Harvard admissions officer). Analyze the following ${type}.
    
    Evaluate the writing based on high-level admissions criteria:
    1. **Narrative Arc**: Does the story have a clear beginning, inflection point, and growth?
    2. **"Show, Don't Tell"**: Does the author provide specific examples or just general statements?
    3. **Authenticity & Vulnerability**: Is the voice unique and honest?
    4. **Future Impact**: Does the essay clearly connect past experiences to future goals?
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
        "globalSummary": "A 2-3 sentence high-level summary of the essay's core strength, main theme, and one key area for improvement.",
        "paragraphBreakdown": [
          { 
            "section": "Introduction/Hook", 
            "role": "one word role (e.g. Hook, Context, Thesis)",
            "purpose": "A strategic sentence explaining the narrative purpose of this paragraph",
            "main_idea": "Summary of the content",
            "strength": "What is working well here",
            "critique": "Constructive feedback on what is missing or could be improved (be specific)",
            "status": "strong" 
          },
          { 
            "section": "Body Paragraph 1", 
            "role": "one word role",
            "purpose": "A strategic sentence explaining the narrative purpose",
            "main_idea": "Summary of the content",
            "strength": "What is working well here",
            "critique": "Constructive feedback on what is missing or could be improved (be specific)",
            "status": "strong" 
          },
          {
            "section": "Conclusion", 
            "role": "Conclusion",
            "purpose": "How this resolves the narrative arc",
            "main_idea": "Summary of final thoughts",
            "strength": "What is working well here",
            "critique": "Constructive feedback on what is missing or could be improved (be specific)",
            "status": "strong" 
          }
        ]
      }

      IMPORTANT: You MUST analyze EVERY single paragraph in the essay, from the very first to the very last. 
      - Do not skip any paragraphs.
      - First paragraph is usually the Hook/Introduction.
      - Last paragraph is the Conclusion.
      - Label them sequentially (Introduction, Body Paragraph 1, Body Paragraph 2... Conclusion).

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

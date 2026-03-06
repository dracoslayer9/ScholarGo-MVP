import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();

        if (!query) {
            throw new Error('Query string is required.');
        }

        // Initialize Perplexity API using the OpenAI SDK client structure
        const perplexity = new OpenAI({
            apiKey: Deno.env.get('PERPLEXITY_API_KEY'),
            baseURL: "https://api.perplexity.ai",
        });

        console.log("Asking Perplexity Sonar Pro for global campus matches...");

        const systemPrompt = `You are an expert global scholarship counselor. The user will provide their background and dreams.
Your task is to search the web and recommend the top 3 best universities GLOBALLY that perfectly match their profile. 
You are NOT restricted to any specific database. Recommend the absolute best fit worldwide (e.g., US, UK, Europe, Asia, etc.).

You MUST return your response ONLY as a RAW JSON string containing an array of exactly 3 matches. DO NOT use markdown, do not wrap in \`\`\`json. Just the raw JSON format.
Format:
{
  "matches": [
    {
      "id": "uuid-or-random-string",
      "university": "University Name",
      "country": "Country",
      "major": "Specific Target Major/Department",
      "matchScore": 95, 
      "reasoning": "A compelling 2-sentence reason why this is a perfect fit, mentioning specific professors, labs, or curriculum aligns with their dream. Keep reasoning strictly in Indonesian.",
      "alumniCareers": "A brief sentence (in Indonesian) explaining common career paths for alumni of this program.",
      "curriculumLink": "The official URL to the program's curriculum or course page.",
      "applicationDeadline": "The typical or upcoming application deadline for this program."
    }
  ]
}
Note: Make sure matchScore is an integer between 85 and 99. The reasoning and alumniCareers must be natural, enthusiastic, and strictly in Indonesian.`;

        const completion = await perplexity.chat.completions.create({
            model: "sonar-pro",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0.2
        });

        // Try to parse out the JSON if perplexity wraps it in a code block
        let rawContent = completion.choices[0].message.content || '{"matches":[]}';
        rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

        const resultJson = JSON.parse(rawContent);

        console.log(`Successfully generated ${resultJson.matches?.length || 0} unrestricted matches.`);

        return new Response(JSON.stringify(resultJson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error("Edge Function Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

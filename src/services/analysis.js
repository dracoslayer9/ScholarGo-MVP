import { runRealAnalysis as runOpenAIAnalysis } from './openai';

export const runAnalysis = async (text, preferredModel = 'openai', type = "General Essay", instruction = null, context = null) => {
    // We only support OpenAI via backend now, ignoring preferredModel
    return await runOpenAIAnalysis(text, type, instruction, context);
};

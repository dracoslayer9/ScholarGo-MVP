import * as OpenAI from './openai';
import * as Gemini from './gemini';

// Facade for Analysis
export const runRealAnalysis = async (text, typeOrProvider = "openai", instruction, context, signal = null) => {
    console.log(`[Analysis] Using type/provider: ${typeOrProvider}`);
    // If the caller passes 'gemini' as the second arg, we route to gemini.
    // Otherwise, we assume it's the document type (e.g. 'Awardee Sample') and route to OpenAI.
    if (typeOrProvider === 'gemini') {
        return await Gemini.runRealAnalysis(text, instruction, context, signal);
    }
    // Default to OpenAI, passing typeOrProvider as the 'type'
    return await OpenAI.runRealAnalysis(text, typeOrProvider === 'openai' ? 'General Essay' : typeOrProvider, instruction, context, signal);
};

// Facade for Chat
export const sendChatMessage = async (message, history, documentContent, provider = "openai", signal = null) => {
    console.log(`[Chat] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.sendChatMessage(message, history, documentContent, signal); // Assuming Gemini is updated similarly
    }
    if (provider === 'perplexity') {
        return await OpenAI.sendChatMessage(message, history, documentContent, signal, 'perplexity');
    }
    return await OpenAI.sendChatMessage(message, history, documentContent, signal, 'gpt-4o');
};

// Facade for Paragraph Insight (Context Menu)
export const analyzeParagraphInsight = async (paragraphText, provider = "openai") => {
    console.log(`[Insight] Using provider: ${provider}`);
    if (provider === 'gemini') {
        return await Gemini.analyzeParagraphInsight(paragraphText);
    }
    return await OpenAI.analyzeParagraphInsight(paragraphText);
};

// Legacy Wrapper (if used elsewhere)
export const runAnalysis = async (text, preferredModel = 'openai', instruction = null, context = null) => {
    return await runRealAnalysis(text, preferredModel, instruction, context);
};

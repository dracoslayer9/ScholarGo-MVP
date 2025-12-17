import { runRealAnalysis as runOpenAIAnalysis } from "./openai";

export const runAnalysis = async (
  text,
  preferredModel = "openai",
  type = "General Essay",
  instruction = null,
  context = null
) => {
  console.log("Using OpenAI backend for analysis...");
  return await runOpenAIAnalysis(text, type, instruction, context);
};

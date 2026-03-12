import { getGeminiConfig } from "../gemini/config.ts";
import { generateFromGemini } from "../gemini/main.ts";

// Need to allow to accept images
export const generateAnswer = async (groupId: string, prompt: string) => {
    const ai_config = await getGeminiConfig(groupId)

    const answer = await generateFromGemini(prompt, {
        temperature: ai_config.temperature,
        //maxTokens: ai_config.maxTokens,
    })

    return {answer: answer, temperature: ai_config.temperature}
}

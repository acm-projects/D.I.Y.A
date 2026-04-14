import { getGeminiConfig } from "../gemini/config.ts";
import { generateFromGemini } from "../gemini/main.ts";

export const generateAnswer = async (groupId: string, prompt: string, imageUrls?: string[]) => {
    const ai_config = await getGeminiConfig(groupId)

    const answer = await generateFromGemini(prompt, {
        temperature: ai_config.temperature,
        //maxTokens: ai_config.maxTokens,
        ...(imageUrls ? { imageUrls } : {}),
    })

    return {answer: answer, temperature: ai_config.temperature}
}

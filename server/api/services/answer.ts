import { getGeminiConfig } from "../gemini/config.js";
import { generateFromGemini } from "../gemini/main.js";

// Need to allow to accept images
export const generateAnswer = async (groupId: string, prompt: string) => {
    const ai_config = await getGeminiConfig(groupId)
    const fullPrompt = 
        `System Prompt: ${ai_config.sysPrompt}\n` +
        `Student Prompt: ${prompt}\n` +
        `Respond in 150-200 words`

    const answer = await generateFromGemini(fullPrompt, {
        temperature: ai_config.temperature,
        maxTokens: ai_config.maxTokens,
    })

    return answer
}

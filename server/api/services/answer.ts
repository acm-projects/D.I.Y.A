import { getGeminiConfig } from "../gemini/config.ts";
import { generateFromGemini } from "../gemini/main.ts";
import type { GeminiImageInput } from "../gemini/main.ts";

export const generateAnswer = async (groupId: string, prompt: string, images: GeminiImageInput[] = []) => {
    const ai_config = await getGeminiConfig(groupId)

    const answer = await generateFromGemini(prompt, {
        systemPrompt: ai_config.sysPrompt,
        temperature: ai_config.temperature,
        //maxTokens: ai_config.maxTokens,
        images,
    })

    return {answer: answer, temperature: ai_config.temperature}
}

import { classifyBySubject } from "../services/classifier.js";
import { getTemperature } from "../services/temperature.js";
import { STEM_PROMPT, NON_STEM_PROMPT } from "./prompts.js";

export const getGeminiConfig = async (groupId: string) => {
    const type = await classifyBySubject(groupId)
    const temperature = getTemperature(type)
    const sysPrompt = type === 'STEM' ? STEM_PROMPT : NON_STEM_PROMPT

    return {
        sysPrompt,
        temperature,
        maxTokens: 250,
    }
}

import { classifyBySubject } from "../services/classifier.ts";
import { getTemperature } from "../services/temperature.ts";
import { STEM_PROMPT, NON_STEM_PROMPT } from "./prompts.ts";

export const getGeminiConfig = async (groupId: string) => {
    const type = await classifyBySubject(groupId)
    const temperature = getTemperature(type)
    const sysPrompt = type === 'STEM' ? STEM_PROMPT : NON_STEM_PROMPT

    return {
        temperature,
        //maxTokens: 1000,
        sysPrompt,
    }
}

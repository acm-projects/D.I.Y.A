import { GRADING_PROMPT } from '../gemini/prompts.ts';
import { generateFromGemini } from '../gemini/main.ts';

// Need to detect the type of criteria used, and allow to accept images
export const generateGrade = async (answer: string, criteria: string) => {
    const fullPrompt = 
        `System Prompt: ${GRADING_PROMPT}\n` +
        `Student Answer: ${answer}\n` +
        `Grading Criterion: ${criteria}\n` +
        `Assign a grade and provide feedback with 150-200 words`

    const grade = await generateFromGemini(fullPrompt, {
        temperature: 0.3,
        //maxTokens: 250,
    })

    return grade
}

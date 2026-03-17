import { GRADING_PROMPT } from '../gemini/prompts.ts';
import { generateFromGemini } from '../gemini/main.ts';
import type { GeminiImageInput } from '../gemini/main.ts';

export interface GradeResult {
    score: number;
    feedback: string;
}

const normalizeJsonResponse = (value: string) =>
    value
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

export const generateGrade = async (answer: string, criteria: string, images: GeminiImageInput[] = []) => {
    const fullPrompt = `
        Student Answer:
        ${answer}

        Grading Criteria:
        ${criteria}

        Return ONLY valid JSON in this format:
        {
            "score": number (0-100),
            "feedback": "150-200 words"
    } 
    `

    const grade = await generateFromGemini(fullPrompt, {
        systemPrompt: GRADING_PROMPT,
        temperature: 0.3,
        images,
    })

    try {
        if (typeof grade === 'string') {
            const parsedGrade = JSON.parse(normalizeJsonResponse(grade)) as GradeResult
            if (parsedGrade.score !== undefined && parsedGrade.feedback !== undefined) {
                return parsedGrade
            } else {
                console.warn('Parsed grade is missing required fields:', parsedGrade)
            }
        }
    } catch (error) {
        console.error('Error parsing grade response:', error)
    }

    return grade
}

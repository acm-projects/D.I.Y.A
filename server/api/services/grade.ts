import { GRADING_PROMPT } from '../gemini/prompts.ts';
import { generateFromGemini } from '../gemini/main.ts';

export interface GradeResult {
    score: number;
    feedback: string;
}

// Need to detect the type of criteria used, and allow to accept images
export const generateGrade = async (answer: string, criteria: string) => {
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
    })

    try {
        if (typeof grade === 'string') {
            const parsedGrade = JSON.parse(grade) as GradeResult
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

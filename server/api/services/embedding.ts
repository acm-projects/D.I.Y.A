import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables");
}

const getAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// Generate embedding for semantic comparison of text
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const model = getAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    return embedding.values;
};


// Measure the angle between 2 vectors, determining their similarity
export const cosineSimilarity = (
    vecA: number[] | undefined, 
    vecB: number[] | undefined
): number => {
    if (!vecA || !vecB) {
        return 0;
    }
    
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must be of the same length");
    }

    let dotProduct = 0;
    let magnitude2A = 0;
    let magnitude2B = 0;

    for (let i = 0; i < vecA.length; i++) {
        const a = vecA[i];
        const b = vecB[i];

        if (a === undefined || b === undefined) {
            return 0;
        }

        dotProduct += a * b;
        magnitude2A += a * a;
        magnitude2B += b * b;
    }

    if (magnitude2A === 0 || magnitude2B === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(magnitude2A) * Math.sqrt(magnitude2B));
};

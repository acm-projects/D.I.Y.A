import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();  // Load environment variables from .env file

const apiKey = process.env.GEMINI_API_KEY;  // Get the API key

if (!apiKey) {  // If the API key is undefined, throw an error
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({    // Create an instance of the GoogleGenAI class with the provided API key
  apiKey,
});

export interface GeminiImageInput {
  data: string
  mimeType: string
}

export interface GenerateGeminiOptions {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  images?: GeminiImageInput[]
}

const normalizeImageData = (data: string) => {
  const trimmedData = data.trim()
  const separatorIndex = trimmedData.indexOf(',')
  return separatorIndex >= 0 ? trimmedData.slice(separatorIndex + 1).trim() : trimmedData
}

export async function generateFromGemini(prompt: string, 
  options?: GenerateGeminiOptions): Promise<string> {
  const parts = [
    { text: prompt },
    ...((options?.images ?? []).map((image) => ({
      inlineData: {
        data: normalizeImageData(image.data),
        mimeType: image.mimeType,
      },
    }))),
  ]

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    
    config: {
      systemInstruction: options?.systemPrompt ?? `You are a helpful assistant that provides clear 
                                                    and concise answers to student questions based 
                                                    on the provided prompt.`,
      temperature: options?.temperature ?? 0.5,  // Use provided temperature or default to 0.5
      ...(options?.maxTokens !== undefined ? { maxOutputTokens: options.maxTokens } : {}),
    },
  });

  return response.text ?? "Could not generate a response from Gemini.";
}

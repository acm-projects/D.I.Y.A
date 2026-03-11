import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();  // Load environment variables from .env file

const apiKey = process.env.GEMINI_API_KEY;  // Get the API key

if (!apiKey) {  // If the API key is undefined, throw an error
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({    // Create an instance of the GoogleGenAI class with the provided API key
  apiKey,
});

export async function generateFromGemini(prompt: string, 
  options?: { temperature?: number, maxTokens?: number }): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    
    config: {
      temperature: options?.temperature ?? 0.5,  // Use provided temperature or default to 0.5
      maxOutputTokens: options?.maxTokens ?? 300,  // Use provided maxTokens or default to 300
    },
  });

  return response.text ?? "Could not generate a response from Gemini.";
}

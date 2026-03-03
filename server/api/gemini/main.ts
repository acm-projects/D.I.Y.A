import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;  // Get the API key

if (!apiKey) {  // If the API key is undefined, throw an error
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({    // Create an instance of the GoogleGenAI class with the provided API key
  apiKey,
});

export async function generateFromGemini(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}

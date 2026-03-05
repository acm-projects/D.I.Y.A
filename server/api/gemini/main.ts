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

export function fileToGenerativePart(filePath: string, mimeType: string) {
  const buffer = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    }
  };
}

export async function run() {
  const model = "gemini-2.5-flash";
  const prompt = "";
  const imageParts = [fileToGenerativePart("path/to/image.png", "image/png")];

  const result = await ai.models.generateContent({
    model,
    contents: [prompt, ...imageParts],
  });

  const text = await result.text;
  console.log(text);
}

// export async function generateFromGemini(prompt: string) {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: prompt,
//   });

//   return response.text;
// }

import { GoogleGenAI } from "@google/genai";
import type { Part } from "@google/genai";
import { getGeminiConfig } from "../gemini/config.ts";
import dotenv from "dotenv";

dotenv.config();  // Load environment variables from .env file

const apiKey = process.env.GEMINI_API_KEY;  // Get the API key

if (!apiKey) {  // If the API key is undefined, throw an error
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({    // Create an instance of the GoogleGenAI class with the provided API key
  apiKey,
});

/**
 * Convert either a remote file URL or a base64 data URL into a Gemini inline-data Part.
 * Supports images and PDFs.
 */
async function sourceToInlinePart(source: string): Promise<Part> {
  if (source.startsWith("data:")) {
    const match = source.match(/^data:([^;]+);base64,(.+)$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error("Invalid data URL attachment.");
    }

    const mimeType = match[1];
    const data = match[2];

    return {
      inlineData: {
        mimeType,
        data,
      },
    };
  }

  const resp = await fetch(source);
  if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const mimeType = resp.headers.get("content-type") || "application/octet-stream";
  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

export async function generateFromGemini(prompt: string, 
  options?: { temperature?: number, maxTokens?: number, systemPrompt?: string, imageUrls?: string[] }): Promise<string> {

  // Build multimodal content parts
  const parts: Part[] = [];

  // Add image/file parts if provided
  if (options?.imageUrls?.length) {
    for (const url of options.imageUrls) {
      try {
        const part = await sourceToInlinePart(url);
        parts.push(part);
      } catch (err) {
        console.error(`[Gemini] Failed to load file from URL: ${url}`, err);
      }
    }
  }

  // Add the text prompt
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: parts,
    
    config: {
      systemInstruction: options?.systemPrompt ?? `You are a helpful assistant that provides clear 
                                                    and concise answers to student questions based 
                                                    on the provided prompt. When an image or document 
                                                    is provided, analyze it carefully and answer any 
                                                    questions about its content.`,
      temperature: options?.temperature ?? 0.5,  // Use provided temperature or default to 0.5
      //maxOutputTokens: options?.maxTokens ?? 1000,  // Use provided maxTokens or default to 800
    },
  });

  return response.text ?? "Could not generate a response from Gemini.";
}

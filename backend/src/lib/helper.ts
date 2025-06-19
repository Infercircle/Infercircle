import { Request, Response, NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";

export function asyncHandler(fn: Function) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


export async function gemini(prompt: string, config: any): Promise<string> {
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  
  try {
    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: config,
    });

    const responseData = result.text;
    if(!responseData){
      throw new Error('No response text received from Gemini API');
    }
    return responseData;
  } catch (error) {
    console.error('Error generating content with Gemini API:', error);
    throw new Error('Failed to generate content with Gemini API');
  }
}
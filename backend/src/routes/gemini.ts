import express from 'express';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import { Request, Response } from 'express';
import { asyncHandler } from '../lib/helper';

interface GeminiSearchQuery {
  search_string?: string;
  lastXDays?: string;
}

const router = express.Router();

router.get('/gemini-search', asyncHandler(async (req: Request<any, any, any, GeminiSearchQuery>, res: Response) => {  
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });

  const { search_string, lastXDays } = req.query;

  if (!search_string || !lastXDays) {
    return res.status(400).json({ error: 'Missing search_string or lastXDays query parameter' });
  }

  const prompt = `you are an expert researcher, and you can dig up in detail current social sentiments about any projects via tweets, youtube videos etc, Can you please find latest videos realted to or about ${search_string} in Youtube in last ${lastXDays} days today is ${new Date().toISOString()}, with transcript and timestamps of important part and summary of each videos, please get as many videos as possible, minimum of ${Math.min(parseInt((parseFloat(lastXDays) * 25).toString()), 100)} top videos(we must have atleast minimum number of videos but more the merrier, ), under the given timeframe, can you please format the response information into an array of JSON object sorted by most popular and then by date with the following structure:

[
  {
    "title": "string",
    "channel": "string",
    "url": "string",
    "date": "string",
    "summary": "string",
    "transcript_highlights": [
      {
        "timestamp": "string",
        "content": "string"
      }
    ]
  }
]`;

  try {
    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
              },
              channel: {
                type: "STRING",
              },
              url: {
                type: "STRING",
              },
              date: {
                type: "STRING",
              },
              summary: {
                type: "STRING",
              },
              transcript_highlights: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    timestamp: {
                      type: "STRING",
                    },
                    content: {
                      type: "STRING",
                    },
                  },
                  propertyOrdering: ["timestamp", "content"],
                },
              },
            },
            propertyOrdering: ["title", "channel", "url", "date", "summary", "transcript_highlights"],
          },
        },
      },
    });

    const responseData = result.text;
    if(!responseData){
        return res.status(500).json({ error: 'Failed to get response from Gemini API' });
    }
    res.json(JSON.parse(responseData));
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
}));

export default router;

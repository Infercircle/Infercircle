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

function extractVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getTranscript(videoId: string): Promise<string> {
  try {
    if(!process.env.HELPER_APIS_URL) {
      throw new Error('HELPER_APIS_URL is not defined in environment variables');
    }
    const response = await fetch(`${process.env.HELPER_APIS_URL}/ytTranscript?video_id=${videoId}`);
    const transcriptData = await response.json();

    if(transcriptData.detail){
      throw new Error(transcriptData.detail);
    }
    return JSON.stringify(transcriptData.transcript.snippets);
  } catch (error) {
    console.error(`Error fetching transcript for video ID ${videoId}:`, error);
    throw new Error('Could not fetch transcript. The video might not have one available.');
  }
}

async function summary(transcript:string) {
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });

  const prompt = `you are an expert researcher, Given the transcript of a YouTube video, you will summarize the video and extract key highlights from the transcript with the time stamps. The output should be a JSON object with the following structure:

  {
    "summary": "string",
    "transcript_highlights": [
      {
        "content": "string"
        "timeStamps": "string"
      }
    ]
  }

  This is the transcript of the video: ${transcript}
`;

  try {
    console.log('Generating content with Gemini API.....................................................');
    console.log('Prompt:', prompt);
    console.log("-------------------------------------------------------------------------------------------");

    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: {
              type: "STRING",
            },
            transcript_highlights: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  content: {
                    type: "STRING",
                  },
                  timeStamps: {
                    type: "STRING",
                  }
                },
                propertyOrdering: ["content", "timeStamps"],
              },
            },
          }
        },
      },
    });

    const responseData = result.text;
    return responseData;
  } catch (error) {
    console.error('Error generating content with Gemini API:', error);
    throw new Error('Failed to generate content with Gemini API');
  }
}

router.post('/gemini-search', asyncHandler(async (req: Request<any, any, any, GeminiSearchQuery>, res: Response) => {  
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing videoUrl in request body' });
  }

  const result: {
    url: string;
    summary: string;
    transcript_highlights: {
      content: string;
    }[];
  }[] = [];

  for(const url of videoUrl){
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.error(`Invalid YouTube URL: ${url}`);
      continue;
    }
    const transcript = await getTranscript(videoId);
    console.log("-----------------------------------------------------------------");
    console.log("transcript:", transcript);
    console.log("-----------------------------------------------------------------");
    const responseData = await summary(transcript);
    if(!responseData) {
      console.error(`Failed to get response for video ID ${videoId}`);
      continue;
    }
    const data = JSON.parse(responseData);
    result.push({
      url: url,
      summary: data.summary,
      transcript_highlights: data.transcript_highlights
    });
  }
  res.json(result);
}));

export default router;

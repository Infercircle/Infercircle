import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { Request, Response } from 'express';
import { asyncHandler } from '../lib/helper';

interface GeminiSearchQuery {
  search_string: string;
  lastXDays: string;
  maxResults?: string;
}


interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  viewCount?: string;
  likeCount?: string;
  duration?: string;
}


interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }>;
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

  const prompt = `you are an expert researcher, Given the transcript of a YouTube video, you will summarize the video. The output should be a JSON object with the following structure:

  {
    "summary": "string",
  }

  This is the transcript of the video: ${transcript}
`;

  try {

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

async function fetchTopYouTubeVideos(
  queryString: string,
  lastXDays: number,
  apiKey: string,
  maxResults: number = 50,
): Promise<YouTubeVideo[]> {
  if (!apiKey) {
    throw new Error('YouTube API key is required');
  }

  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  
  // Calculate the date X days ago
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - lastXDays);
  const publishedAfterISO = publishedAfter.toISOString();
  
  try {
    // Step 1: Search for videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: queryString,
      type: 'video',
      order: 'viewCount', // Order by view count for "top" videos
      publishedAfter: publishedAfterISO,
      videoDuration: 'medium', // Filters videos between 4-20 minutes
      maxResults: maxResults.toString(), // YouTube API max per request
      key: apiKey
    });
    
    const searchUrl = `${baseUrl}/search?${searchParams}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube API search error: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }
    
    // Get video IDs for the second API call
    const videoIds = searchData.items.map(item => item.id.videoId);
    
    // Step 2: Get additional video details (view count, likes, duration)
    const videoDetailsParams = new URLSearchParams({
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
      key: apiKey
    });
    
    const videoDetailsUrl = `${baseUrl}/videos?${videoDetailsParams}`;
    const videoDetailsResponse = await fetch(videoDetailsUrl);
    
    if (!videoDetailsResponse.ok) {
      throw new Error(`YouTube API video details error: ${videoDetailsResponse.status} ${videoDetailsResponse.statusText}`);
    }
    
    const videoDetailsData: YouTubeVideoDetailsResponse = await videoDetailsResponse.json();
    
    // Step 3: Combine search results with video details
    const videos: YouTubeVideo[] = searchData.items.map(item => {
      const videoDetails = videoDetailsData.items.find(detail => detail.id === item.id.videoId);
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        viewCount: videoDetails?.statistics.viewCount,
        likeCount: videoDetails?.statistics.likeCount,
        duration: videoDetails?.contentDetails.duration
      };
    });
    
    // Step 4: Sort by view count (descending) and take top 100
    const sortedVideos = videos
      .filter(video => video.viewCount) // Filter out videos without view count
      .sort((a, b) => parseInt(b.viewCount!) - parseInt(a.viewCount!))
      .slice(0, 100);
    
    return sortedVideos;
    
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}


const router = express.Router();

router.get('/gemini-search', asyncHandler(async (req: Request<any, any, any, GeminiSearchQuery>, res: Response) => {  
  const { search_string, lastXDays, maxResults } = req.query;

  if (!search_string || !lastXDays || !maxResults) {
    return res.status(400).json({ error: 'search_string and lastXDays are required' });
  }

  const videos = await fetchTopYouTubeVideos(search_string, parseInt(lastXDays), process.env.YOUTUBE_API_KEY as string, maxResults? parseInt(maxResults):undefined);

  if (!videos || videos.length === 0) {
    return res.status(404).json({ error: 'No videos found' });
  }

  const result: {
    url: string;
    summary: string;
    transcript_highlights: {
      content: string;
    }[];
  }[] = [];

  for(const video of videos){
    const videoId = video.id;
    if (!videoId) {
      console.error(`Invalid YouTube URL: ${video.id}`);
      continue;
    }
    let transcript;
    try {
      transcript = await getTranscript(videoId);
    } catch (error) {
      console.error(`Failed to get transcript for video ID ${videoId}:`, error);
      continue;
    }
    const responseData = await summary(transcript);
    if(!responseData) {
      console.error(`Failed to get response for video ID ${videoId}`);
      continue;
    }
    const data = JSON.parse(responseData);
    result.push({
      url: 'https://www.youtube.com/watch?v='+videoId,
      summary: data.summary,
      transcript_highlights: data.transcript_highlights
    });
  }
  res.json(result);
}));

export default router;

import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from "dotenv";
import { asyncHandler } from '../lib/helper';
import fetch from 'node-fetch';
import { TwitterSpace, TwitterSpaceSearchResponse } from '../interfaces/twitterspaces';

dotenv.config();

const router = express.Router();

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Helper to generate Twitter Space URL
const generateSpaceUrl = (spaceId: string): string =>
  `https://twitter.com/i/spaces/${spaceId}`;

// --- 1. Search Spaces Endpoint ---
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { query, state = 'all', next_token } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Search for spaces
  const response = await axios.get(`${TWITTER_API_BASE}/spaces/search`, {
    params: {
      query,
      state,
      ...(next_token && { pagination_token: next_token })
    },
    headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
  });

  const spaces = response.data as TwitterSpaceSearchResponse;
  if (!spaces.data || spaces.data.length === 0) {
    return res.json({ data: [] });
  }

  // Get details for found spaces
  const spaceIds = spaces.data.map(space => space.id).join(',');
  const detailsResponse = await axios.get(`${TWITTER_API_BASE}/spaces`, {
    params: {
      ids: spaceIds,
      'space.fields': 'title,creator_id,participant_count,scheduled_start,started_at,state,host_ids,speaker_ids'
    },
    headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
  });

  const detailsData = detailsResponse.data as { data: TwitterSpace[] };
  // Add URLs to each space
  const processedSpaces = detailsData.data.map(space => ({
    ...space,
    url: generateSpaceUrl(space.id)
  }));

  return res.json({ data: processedSpaces });
}));

// --- 2. Download Space Endpoint ---
router.post('/spaces/download', asyncHandler(async (req: Request, res: Response) => {
  const { space_url, is_ended = false } = req.body;
  if (!space_url) {
    return res.status(400).json({ error: 'space_url is required' });
  }

  try {
    const downloadRes = await fetch(`${process.env.HELPER_APIS_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        space_url,
        is_ended 
      })
    });

    if (!downloadRes.ok) {
      const errorData = await downloadRes.json();
      return res.status(downloadRes.status).json({ 
        error: errorData.detail || 'Download failed' 
      });
    }

    const downloadData = await downloadRes.json();
    res.json(downloadData);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download space' });
  }
}));

// --- 3. Transcribe Space Endpoint ---
router.post('/spaces/transcribe', asyncHandler(async (req: Request, res: Response) => {
  const { audio_file_path, space_id } = req.body;
  if (!audio_file_path) {
    return res.status(400).json({ error: 'audio_file_path is required' });
  }

  try {
    const transcribeRes = await fetch(`${process.env.HELPER_APIS_URL}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        audio_file_path,
        space_id 
      })
    });

    if (!transcribeRes.ok) {
      const errorData = await transcribeRes.json();
      return res.status(transcribeRes.status).json({ 
        error: errorData.detail || 'Transcription failed' 
      });
    }

    const transcribeData = await transcribeRes.json();
    res.json(transcribeData);
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe space' });
  }
}));

// --- 4. Download and Transcribe Space Endpoint ---
router.post('/spaces/download-and-transcribe', asyncHandler(async (req: Request, res: Response) => {
  const { space_url, is_ended = false, auto_transcribe = true } = req.body;
  if (!space_url) {
    return res.status(400).json({ error: 'space_url is required' });
  }

  try {
    const downloadAndTranscribeRes = await fetch(`${process.env.HELPER_APIS_URL}/download-and-transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        space_url,
        is_ended,
        auto_transcribe 
      })
    });

    if (!downloadAndTranscribeRes.ok) {
      // Try to get error as text first, then as JSON
      const errorText = await downloadAndTranscribeRes.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return res.status(downloadAndTranscribeRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    // Get response as text since the API returns transcript format
    const transcriptText = await downloadAndTranscribeRes.text();
    
    // Return the transcript as a structured response
    res.json({
      transcript: transcriptText,
      formatted_transcript: transcriptText,
      success: true
    });
  } catch (error) {
    console.error('Download and transcribe error:', error);
    res.status(500).json({ error: 'Failed to download and transcribe space' });
  }
}));

// --- 5. Summarize Space with CeedoTech AI Endpoint ---
router.post('/spaces/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { space_url, is_ended = false } = req.body;
  if (!space_url) {
    return res.status(400).json({ error: 'space_url is required' });
  }

  try {
    // First download and transcribe the space
    const downloadAndTranscribeRes = await fetch(`${process.env.HELPER_APIS_URL}/download-and-transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        space_url,
        is_ended,
        auto_transcribe: true 
      })
    });

    if (!downloadAndTranscribeRes.ok) {
      // Try to get error as text first, then as JSON
      const errorText = await downloadAndTranscribeRes.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return res.status(downloadAndTranscribeRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    // Get response as text since the API returns transcript format
    const transcriptText = await downloadAndTranscribeRes.text();
    const transcript = transcriptText;

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    // Send transcript to AI for summarization
    let summary: string;
    try {
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.sitename.com',
          'X-Title': 'SiteName',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content:
                "You are a skilled crypto analyst and content summarizer.\n\nSummarize the following Twitter Space or Twitter Broadcast into a clear, insightful, and structured recap for a Web3-native audience. The audience includes DeGen's, builders, founders, investors, and analysts who missed the live session.\n\nInstructions:\n\n- Start with a short intro paragraph that includes:\n  - The title of the session (if mentioned)\n  - The hosts and speakers\n  - Any useful context (e.g. technical issues, change of plans, tone of session. Not compulsory unless mentioned)\n  \n- Then use markdown formatting with clear section headings and bullet points.\n\n- Add relevant emojis to highlight important insights if need be (🧠 = takeaways, ⚠️ = risks, 📈 = trends).\n\n- Keep the tone professional yet reader-friendly — smart, focused, and digestible.\n\n- Organize the rest of the summary under these sections:\n\n  1. Key Insights\n  2. Terminology Explained (if new terms or concepts were introduced)\n  3. Problems Identified or is being solved\n  4. Proposed Solutions or Ideas\n  5. What's Coming Next (future plans, updates, or speculation)\n  6. Final Takeaways\n\nYour goal is to educate Web3-native readers who missed the live session."
            },
            {
              role: 'user',
              content: cleanedTranscript
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI service error:', aiResponse.status, errorText);
        throw new Error(`AI service error: ${aiResponse.status} - ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI response received successfully');
      
      summary = aiData.choices?.[0]?.message?.content || 'No summary generated';
      
      if (!summary || summary === 'No summary generated') {
        console.error('AI returned empty summary');
        throw new Error('AI service returned empty summary');
      }

      console.log('Summary generated successfully, length:', summary.length);
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }

    res.json({
      summary,
      transcript,
      success: true
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize space' });
  }
}));

// --- 6. Download Broadcast Endpoint ---
router.post('/broadcasts/download', asyncHandler(async (req: Request, res: Response) => {
  const { broadcast_url, auto_transcribe = false } = req.body;
  if (!broadcast_url) {
    return res.status(400).json({ error: 'broadcast_url is required' });
  }

  try {
    const downloadRes = await fetch(`${process.env.HELPER_APIS_URL}/download-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        broadcast_url,
        auto_transcribe 
      })
    });

    if (!downloadRes.ok) {
      const errorData = await downloadRes.json();
      return res.status(downloadRes.status).json({ 
        error: errorData.detail || 'Download failed' 
      });
    }

    const downloadData = await downloadRes.json();
    res.json(downloadData);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download broadcast' });
  }
}));

// --- 7. Transcribe Broadcast Endpoint ---
router.post('/broadcasts/transcribe', asyncHandler(async (req: Request, res: Response) => {
  const { audio_file_path, broadcast_id } = req.body;
  if (!audio_file_path) {
    return res.status(400).json({ error: 'audio_file_path is required' });
  }

  try {
    const transcribeRes = await fetch(`${process.env.HELPER_APIS_URL}/transcribe-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        audio_file_path,
        space_id: broadcast_id 
      })
    });

    if (!transcribeRes.ok) {
      const errorData = await transcribeRes.json();
      return res.status(transcribeRes.status).json({ 
        error: errorData.detail || 'Transcription failed' 
      });
    }

    const transcribeData = await transcribeRes.json();
    res.json(transcribeData);
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe broadcast' });
  }
}));

// --- 8. Summarize Broadcast Endpoint ---
router.post('/broadcasts/summarize', asyncHandler(async (req: Request, res: Response) => {
  console.log('Broadcast summarize endpoint called');
  const { broadcast_url } = req.body;
  console.log('Broadcast URL:', broadcast_url);
  if (!broadcast_url) {
    return res.status(400).json({ error: 'broadcast_url is required' });
  }

  try {
    // First download and transcribe the broadcast
    console.log('Making broadcast download request to:', `${process.env.HELPER_APIS_URL}/download-broadcast`);
    const downloadRes = await fetch(`${process.env.HELPER_APIS_URL}/download-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        broadcast_url,
        auto_transcribe: true 
      })
    });
    
    console.log('Broadcast download response status:', downloadRes.status);

    if (!downloadRes.ok) {
      console.log('Broadcast download failed:', downloadRes.status);
      // Try to get error as text first, then as JSON
      const errorText = await downloadRes.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return res.status(downloadRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    console.log('Broadcast download successful');

    // Get response as text since the API returns transcript format
    const transcriptText = await downloadRes.text();
    const transcript = transcriptText;
    console.log('Broadcast transcript received, raw length:', transcriptText.length);

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    // Send transcript to AI for summarization
    let summary: string;
    try {
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.sitename.com',
          'X-Title': 'SiteName',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content:
                "You are a skilled crypto analyst and content summarizer.\n\nSummarize the following Twitter Space or Twitter Broadcast into a clear, insightful, and structured recap for a Web3-native audience. The audience includes DeGen's, builders, founders, investors, and analysts who missed the live session.\n\nInstructions:\n\n- Start with a short intro paragraph that includes:\n  - The title of the session (must include the actual title if mentioned)\n  - The hosts and speakers\n  - Any useful context (e.g. technical issues, change of plans, tone of session. Not compulsory unless mentioned)\n  \n- Then use markdown formatting with clear section headings and bullet points.\n\n- Add relevant emojis to highlight important insights if need be (🧠 = takeaways, ⚠️ = risks, 📈 = trends).\n\n- Keep the tone professional yet reader-friendly — smart, focused, and digestible.\n\n- Organize the rest of the summary under these sections:\n\n  1. Key Insights\n  2. Terminology Explained (if new terms or concepts were introduced)\n  3. Problems Identified or is being solved\n  4. Proposed Solutions or Ideas\n  5. What's Coming Next (future plans, updates, or speculation)\n  6. Final Takeaways\n\nYour goal is to educate Web3-native readers who missed the live session."
            },
            {
              role: 'user',
              content: cleanedTranscript
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI service error:', aiResponse.status, errorText);
        throw new Error(`AI service error: ${aiResponse.status} - ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI response received successfully');
      
      summary = aiData.choices?.[0]?.message?.content || 'No summary generated';
      
      if (!summary || summary === 'No summary generated') {
        console.error('AI returned empty summary');
        throw new Error('AI service returned empty summary');
      }

      console.log('Summary generated successfully, length:', summary.length);
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }

    res.json({
      summary,
      transcript,
      success: true
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize broadcast' });
  }
}));

export default router;
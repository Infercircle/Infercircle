import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from "dotenv";
import { asyncHandler } from '../lib/helper';
import fetch from 'node-fetch';
import { TwitterSpace, TwitterSpaceSearchResponse } from '../interfaces/twitterspaces';
import { exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

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
      const errorData = await downloadAndTranscribeRes.json();
      return res.status(downloadAndTranscribeRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    const resultData = await downloadAndTranscribeRes.json();
    res.json(resultData);
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
      const errorData = await downloadAndTranscribeRes.json();
      return res.status(downloadAndTranscribeRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    const resultData = await downloadAndTranscribeRes.json();
    const transcript = resultData.formatted_transcript;

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Send transcript to AI for summarization
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
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
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || 'No summary generated';

    res.json({
      space_id: resultData.space_id,
      summary,
      transcript,
      metadata: resultData.metadata
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
  const { broadcast_url } = req.body;
  if (!broadcast_url) {
    return res.status(400).json({ error: 'broadcast_url is required' });
  }

  try {
    // First download and transcribe the broadcast
    const downloadRes = await fetch(`${process.env.HELPER_APIS_URL}/download-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        broadcast_url,
        auto_transcribe: true 
      })
    });

    if (!downloadRes.ok) {
      const errorData = await downloadRes.json();
      return res.status(downloadRes.status).json({ 
        error: errorData.detail || 'Download and transcribe failed' 
      });
    }

    const resultData = await downloadRes.json();
    const transcript = resultData.formatted_transcript;

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Send transcript to AI for summarization
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
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || 'No summary generated';

    res.json({
      broadcast_id: resultData.broadcast_id,
      summary,
      transcript,
      metadata: resultData.metadata
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize broadcast' });
  }
}));

export default router;
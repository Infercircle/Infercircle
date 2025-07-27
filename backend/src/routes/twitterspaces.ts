import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from "dotenv";
import { asyncHandler, gemini } from '../lib/helper';
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

// --- 2. Summarize Space Endpoint ---
router.post('/spaces/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { space_id } = req.body;
  if (!space_id) {
    return res.status(400).json({ error: 'space_id is required' });
  }

  // 1. Transcribe the space
  const transcribeRes = await fetch(`${process.env.HELPER_APIS_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space_id })
  });
  const transcribeData = await transcribeRes.json();
  if (!transcribeRes.ok) {
    return res.status(500).json({ error: transcribeData.detail || 'Transcription failed' });
  }
  const transcript = transcribeData.transcription;

  // 2. Summarize with Gemini
  const summaryPrompt = `Summarize the following Twitter Space transcript:\n\n${transcript}`;
  const summary = await gemini(summaryPrompt, {});

  res.json({
    space_id,
    summary,
    transcript
  });
}));

// --- 3. Transcribe Only Endpoint ---
router.post('/spaces/transcribe', asyncHandler(async (req: Request, res: Response) => {
  const { space_id } = req.body;
  if (!space_id) {
    return res.status(400).json({ error: 'space_id is required' });
  }

  const transcribeRes = await fetch(`${process.env.HELPER_APIS_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space_id })
  });
  const transcribeData = await transcribeRes.json();
  if (!transcribeRes.ok) {
    return res.status(500).json({ error: transcribeData.detail || 'Transcription failed' });
  }

  res.json({
    space_id,
    transcript: transcribeData.transcription
  });
}));

export default router;
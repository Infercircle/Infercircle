import { NextResponse } from 'next/server';

export async function GET() {
  const HELPER_APIS_URL = process.env.HELPER_APIS_URL;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      helper_apis_url: HELPER_APIS_URL ? 'configured' : 'missing',
      openrouter_api_key: OPENROUTER_API_KEY ? 'configured' : 'missing',
    },
    endpoints: {
      spaces: '/api/content-summarizer/spaces',
      broadcasts: '/api/content-summarizer/broadcasts',
    },
    maxDuration: '30 minutes'
  });
}

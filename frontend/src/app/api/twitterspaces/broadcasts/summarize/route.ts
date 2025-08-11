import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Custom axios with no timeout
async function axiosWithNoTimeout(url: string, options: any) {
  return axios({
    url,
    method: 'POST',
    headers: options.headers,
    data: options.body,
    timeout: 0, // No timeout
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Broadcast API route called');
    const body = await request.json();
    console.log('Broadcast request body:', body);
    
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/twitterspaces/broadcasts/summarize`;
    console.log('Calling backend URL:', backendUrl);
    
    // Forward the request to the backend with no timeout
    const backendResponse = await axiosWithNoTimeout(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(body),
    });

    if (backendResponse.status !== 200) {
      const errorData = backendResponse.data;
      return NextResponse.json(
        { error: errorData.error || 'Backend request failed' },
        { status: backendResponse.status }
      );
    }

    const data = backendResponse.data;
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
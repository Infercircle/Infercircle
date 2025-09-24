import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HELPER_APIS_URL = process.env.NEXT_PUBLIC_HELPER_APIS_URL;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { broadcast_url, is_ended = false } = await request.json();

    if (!broadcast_url) {
      return NextResponse.json({ error: 'broadcast_url is required' }, { status: 400 });
    }

    if (!HELPER_APIS_URL) {
      return NextResponse.json({ error: 'Helper API URL not configured' }, { status: 500 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    console.log('🚀 Starting Twitter Broadcast chunked processing...');
    console.log('📡 Broadcast URL:', broadcast_url);
    console.log('📡 Helper API URL:', HELPER_APIS_URL);
    
    // Call the broadcast chunked endpoint on helper
    console.log('⏳ Starting chunked download and transcription (broadcast)...');
    const chunkedResponse = await axios.post(`${HELPER_APIS_URL}/download-and-transcribe-broadcast-runpod-chunked`, {
      broadcast_url,
      is_ended,
      auto_transcribe: true 
    }, {
      timeout: 1800000, // 30 minutes timeout
      headers: { 'Content-Type': 'application/json' }
    });

    const responseData = chunkedResponse.data as any;
    console.log('✅ Broadcast chunked processing completed');
    console.log('📝 Response data keys:', Object.keys(responseData || {}));
    
    // Extract transcript from the response object
    const transcript = responseData?.formatted_transcript;
    if (!transcript || typeof transcript !== 'string') {
      console.error('❌ Invalid transcript received for broadcast:', transcript);
      return NextResponse.json({ 
        error: 'Invalid transcript received from download service' 
      }, { status: 500 });
    }

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    // Send transcript to AI for summarization
    console.log('🤖 Sending broadcast transcript to AI for summarization...');
    let summary: string;
    try {
      const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content:
              "You are a skilled crypto analyst and content summarizer.\n\nSummarize the following Twitter Broadcast into a clear, insightful, and structured recap for a Web3-native audience. Use markdown headings and bullet points where helpful."
          },
          {
            role: 'user',
            content: cleanedTranscript
          }
        ]
      }, {
        timeout: 300000, // 5 minutes timeout for AI
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.sitename.com',
          'X-Title': 'SiteName',
          'Content-Type': 'application/json',
        }
      });

      console.log('AI response received successfully for broadcast');
      summary = (aiResponse.data as any).choices?.[0]?.message?.content || 'No summary generated';

      if (!summary || summary === 'No summary generated') {
        throw new Error('AI service returned empty summary');
      }
    } catch (error) {
      console.error('AI service error (broadcast):', error);
      throw error;
    }

    console.log('🎉 Broadcast summarization completed successfully!');
    return NextResponse.json({
      summary,
      transcript,
      broadcast_id: responseData?.broadcast_id,
      download: responseData?.download,
      metadata: responseData?.metadata,
      success: true
    });

  } catch (error) {
    console.error('Broadcast chunked summarize error:', error);
    return NextResponse.json({ error: 'Failed to summarize broadcast with chunked processing' }, { status: 500 });
  }
}



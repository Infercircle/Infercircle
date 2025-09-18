import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HELPER_APIS_URL = process.env.HELPER_APIS_URL;

export async function POST(request: NextRequest) {
  try {
    const { space_url, is_ended = false } = await request.json();

    if (!space_url) {
      return NextResponse.json({ error: 'space_url is required' }, { status: 400 });
    }

    if (!HELPER_APIS_URL) {
      return NextResponse.json({ error: 'Helper API URL not configured' }, { status: 500 });
    }

    console.log('🚀 Starting Twitter Space streaming processing...');
    console.log('📡 Space URL:', space_url);
    console.log('📡 Helper API URL:', HELPER_APIS_URL);
    
    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const initialData = {
            type: 'status',
            message: 'Starting chunked download and transcription...',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

          // Call the chunked endpoint
          console.log('⏳ Starting chunked download and transcription...');
          const chunkedResponse = await axios.post(`${HELPER_APIS_URL}/download-and-transcribe-runpod-chunked`, {
            space_url,
            is_ended,
            auto_transcribe: true 
          }, {
            timeout: 1800000, // 30 minutes timeout
            headers: { 'Content-Type': 'application/json' }
          });

          const responseData = chunkedResponse.data as any;
          console.log('✅ Chunked processing completed');
          
          // Send completion status
          const completionData = {
            type: 'complete',
            message: 'Transcription completed successfully',
            data: {
              transcript: responseData?.formatted_transcript,
              space_id: responseData?.space_id,
              download: responseData?.download,
              metadata: responseData?.metadata
            },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completionData)}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = {
            type: 'error',
            message: 'Failed to process space',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Streaming endpoint error:', error);
    return NextResponse.json({ error: 'Failed to start streaming processing' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HELPER_APIS_URL = process.env.HELPER_APIS_URL;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;



export async function POST(request: NextRequest) {
  try {
    const { broadcast_url } = await request.json();

    if (!broadcast_url) {
      return NextResponse.json({ error: 'broadcast_url is required' }, { status: 400 });
    }

    if (!HELPER_APIS_URL) {
      return NextResponse.json({ error: 'Helper API URL not configured' }, { status: 500 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    console.log('🚀 Starting Twitter Broadcast processing...');
    console.log('📡 Broadcast URL:', broadcast_url);
    console.log('📡 Helper API URL:', HELPER_APIS_URL);

    // First download and transcribe the broadcast
    console.log('⏳ Downloading and transcribing broadcast...');
    console.log('📡 Making request to:', `${HELPER_APIS_URL}/download-broadcast`);
    const downloadRes = await axios.post(`${HELPER_APIS_URL}/download-broadcast`, {
      broadcast_url,
      auto_transcribe: true 
    }, {
      timeout: 1800000, // 30 minutes timeout
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Broadcast download successful');

    // Get response as object since the API returns JSON format
    const responseData = downloadRes.data as any;
    console.log('📝 Broadcast response data type:', typeof responseData);
    console.log('📝 Broadcast response data keys:', Object.keys(responseData || {}));
    
    // Extract transcript from the response object
    const transcript = responseData?.formatted_transcript;
    console.log('📝 Broadcast transcript data type:', typeof transcript);
    console.log('📝 Broadcast transcript received, length:', transcript?.length || 'undefined', 'characters');
    
    // Check if transcript is valid
    if (!transcript || typeof transcript !== 'string') {
      console.error('❌ Invalid broadcast transcript received:', transcript);
      return NextResponse.json({ 
        error: 'Invalid transcript received from download service' 
      }, { status: 500 });
    }

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Send transcript to AI for summarization
    console.log('🤖 Sending broadcast transcript to AI for summarization...');
    let summary: string;
    try {
      const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
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
      }, {
        timeout: 300000, // 5 minutes timeout for AI
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://www.sitename.com',
          'X-Title': 'SiteName',
          'Content-Type': 'application/json',
        }
      });

      console.log('AI response received successfully');
      
      summary = (aiResponse.data as any).choices?.[0]?.message?.content || 'No summary generated';
      
      if (!summary || summary === 'No summary generated') {
        console.error('AI returned empty summary');
        throw new Error('AI service returned empty summary');
      }

      console.log('Summary generated successfully, length:', summary.length);
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }

    console.log('🎉 Broadcast summarization completed successfully!');
    console.log('📊 Summary length:', summary.length, 'characters');
    
    return NextResponse.json({
      summary,
      transcript,
      broadcast_id: responseData?.broadcast_id,
      download: responseData?.download,
      metadata: responseData?.metadata,
      success: true
    });

  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'Failed to summarize broadcast' }, { status: 500 });
  }
}
